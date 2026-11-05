#!/bin/zsh
# usage: search_one.sh <id> <query>  -> prints top 4 candidates
yt-dlp --flat-playlist --no-warnings --print "$1	%(id)s	%(channel)s	%(duration)s	%(view_count)s	%(title)s" "ytsearch6:$2" 2>/dev/null | awk -F'\t' '$4>=120 && $4<=14400' | head -4
