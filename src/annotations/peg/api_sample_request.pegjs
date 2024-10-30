// @apiSampleRequest [{type}] [off]|[on]|[...]

start
  = type:Type? url:AtLeastOneChar { return { type, url } }

Type
  = "{" _ name:TypeName _ "}" { return { name } }
  
TypeName
  = head:TypeNameCharacter+ { return head.join('') }

TypeNameCharacter
  = !"}" char:. { return char }

AtLeastOneChar
  = head:.+ { return head.join('') || null }
 
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