autoload -Uz compinit
compinit

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"


[[ "$TERM_PROGRAM" == "kiro" ]] && . "$(kiro --locate-shell-integration-path zsh)"

# Added by Antigravity
export PATH="/Users/apekshaverma/.antigravity/antigravity/bin:$PATH"


# Load Angular CLI autocompletion.
if command -v ng >/dev/null 2>&1; then
source <(ng completion script)
fi

# Added by Windsurf
export PATH="/Users/apekshaverma/.codeium/windsurf/bin:$PATH"
eval "$(/opt/homebrew/bin/brew shellenv)"
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export PATH=$JAVA_HOME/bin:$PATH
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"

