//

start
  = type:Type [ \t]+ description:Description { return { type, description } }
  / type:Type { return { type, description: null } }
  / description:Description? { return { type: null, description } }

Type
  = "{" _ name:Any "}" { return { name } }

Description
  = description:.* { return description.join('') }

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