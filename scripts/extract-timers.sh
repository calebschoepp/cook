#!/usr/bin/env bash
set -euo pipefail

# TODO: This is a jank workaround for extracting timers from cook files
# We parse the cook file to find timers, then extract clean context from the markdown
# In the future, we should build a proper parser or extend the cook CLI

cook_file="$1"
markdown_file="$2"

# First, extract timers from cook file with their values
# Store timers in parallel arrays (bash 3.2 compatible)
timer_durations=()
timer_units=()
in_steps=false

while IFS= read -r line; do
    # Check if we've entered the steps section (after the front matter ---)
    if [[ "$line" =~ ^--- ]]; then
        if [ "$in_steps" = false ]; then
            in_steps=true
        fi
        continue
    fi

    # Skip until we're in the steps section
    if [ "$in_steps" = false ]; then
        continue
    fi

    # Check if line contains a timer matching ~{number%unit} or ~{number-number%unit}
    if [[ "$line" =~ ~\{[0-9]+-?[0-9]*%[a-z]+\} ]]; then
        # Extract all timers from this line
        timers_in_line=$(echo "$line" | grep -oE '~\{[0-9]+-?[0-9]*%[a-z]+\}' || true)

        # For each timer, store its values
        while IFS= read -r timer; do
            if [ -n "$timer" ]; then
                # Extract duration and unit
                timer_value=$(echo "$timer" | sed 's/~{//g' | sed 's/}//g')
                duration=$(echo "$timer_value" | cut -d'%' -f1)
                unit=$(echo "$timer_value" | cut -d'%' -f2)

                # Check if this timer is already in our arrays (avoid duplicates)
                is_duplicate=false
                for i in "${!timer_durations[@]}"; do
                    if [ "${timer_durations[$i]}" = "$duration" ] && [ "${timer_units[$i]}" = "$unit" ]; then
                        is_duplicate=true
                        break
                    fi
                done

                if [ "$is_duplicate" = false ]; then
                    timer_durations+=("$duration")
                    timer_units+=("$unit")
                fi
            fi
        done <<< "$timers_in_line"
    fi
done < "$cook_file"

# If no timers found, exit early
if [ ${#timer_durations[@]} -eq 0 ]; then
    exit 0
fi

# Now extract context from the markdown file (already converted by cook CLI)
# The markdown has clean text without cook syntax
timer_contexts=()
in_steps_section=false

# Initialize contexts array with empty strings
for i in "${!timer_durations[@]}"; do
    timer_contexts+=("")
done

# Read the entire steps section and join lines to handle wrapped text
current_step=""
while IFS= read -r md_line; do
    # Find the Steps section
    if [[ "$md_line" =~ ^##[[:space:]]+Steps ]]; then
        in_steps_section=true
        continue
    fi

    # Exit if we hit another ## section (but not ###)
    if [ "$in_steps_section" = true ] && [[ "$md_line" =~ ^##[[:space:]] ]]; then
        break
    fi

    # Process lines in steps section
    if [ "$in_steps_section" = true ]; then
        # Skip subsection headers (### headers within Steps section)
        if [[ "$md_line" =~ ^###[[:space:]] ]]; then
            continue
        fi

        # If this is a new step (starts with number) or empty line
        if [[ "$md_line" =~ ^[0-9]+\. ]] || [ -z "$md_line" ]; then
            # Process the previous step if we have one
            if [ -n "$current_step" ]; then
                # Check each timer to see if this step matches its time value
                for i in "${!timer_durations[@]}"; do
                    duration="${timer_durations[$i]}"
                    unit="${timer_units[$i]}"

                    # Check if this step contains the timer duration
                    if echo "$current_step" | grep -q "${duration}[[:space:]]*${unit}"; then
                        # Extract clean context - remove step number and take part before timer
                        full_context=$(echo "$current_step" | sed 's/^[0-9]*\.[[:space:]]*//' | sed "s/${duration}[[:space:]]*${unit}.*//g" | sed 's/\.[[:space:]]*$//' | xargs)
                        # Truncate to 60 chars - keep the END (last 60 chars) with ellipsis at start if needed
                        if [ ${#full_context} -gt 60 ]; then
                            context=...$(echo "$full_context" | tail -c 58)
                        else
                            context="$full_context"
                        fi
                        timer_contexts[$i]="$context"
                    fi
                done
            fi
            # Start new step
            current_step="$md_line"
        else
            # Continue current step (handle wrapped lines)
            if [ -n "$current_step" ]; then
                current_step="$current_step $md_line"
            fi
        fi
    fi
done < "$markdown_file"

# Process the last step
if [ -n "$current_step" ]; then
    for i in "${!timer_durations[@]}"; do
        duration="${timer_durations[$i]}"
        unit="${timer_units[$i]}"

        if echo "$current_step" | grep -q "${duration}[[:space:]]*${unit}"; then
            full_context=$(echo "$current_step" | sed 's/^[0-9]*\.[[:space:]]*//' | sed "s/${duration}[[:space:]]*${unit}.*//g" | sed 's/\.[[:space:]]*$//' | xargs)
            # Truncate to 60 chars - keep the END (last 60 chars) with ellipsis at start if needed
            if [ ${#full_context} -gt 60 ]; then
                context=...$(echo "$full_context" | tail -c 58)
            else
                context="$full_context"
            fi
            timer_contexts[$i]="$context"
        fi
    done
fi

# Append Timers section to markdown
echo "" >> "$markdown_file"
echo "## Timers" >> "$markdown_file"
echo "" >> "$markdown_file"

# Output timers with their contexts
for i in "${!timer_durations[@]}"; do
    duration="${timer_durations[$i]}"
    unit="${timer_units[$i]}"
    context="${timer_contexts[$i]}"

    if [ -n "$context" ]; then
        echo "### Timer: $duration $unit - $context" >> "$markdown_file"
    else
        echo "### Timer: $duration $unit" >> "$markdown_file"
    fi
    echo "" >> "$markdown_file"
done
