// @apiDescription [{type}] description

start
  = type:Type __ description:AtLeastOneChar { return { type, description } }
  / description:AtLeastOneChar { return { type: null, description } }

Type
  = "{" _ name:Any "}" { return { name } }

Rest
  = head:.* { return head.join('') || null }

AtLeastOneChar
  = head:.+ { return head.join('') || null }
 
Any
  = head:[a-zA-Z0-9_-]+ { return head.join('') }
  / String

String
  = '"' chars:DoubleStringCharacter* '"' { return chars.join('') }
  / "'" chars:SingleStringCharacter* "'" { return chars.join('') }

DoubleStringCharacter
  = !('"' / "\\") char:. { return char}
  / "\\" sequence:EscapeSequence { return sequence}

SingleStringCharacter
  = !("'" / "\\") char:. { return char}
  / "\\" sequence:EscapeSequence { return sequence}

EscapeSequence
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b" }
  / "f"  { return "\f" }
  / "n"  { return "\n" }
  / "r"  { return "\r" }
  / "t"  { return "\t" }
  / "v"  { return "\x0B"}

_ "whitespace"
  = [ \t]*

__ "whitespace"
  = [ \t]+