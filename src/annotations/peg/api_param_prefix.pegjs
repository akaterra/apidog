// @apiParamPrefix [(group)] path

start
  = group:Group? _ field:Field? { return { group, field } }

Group
  = "(" _ name:Any _ ")" { return { name } }

Field
  = "[" _ name:Path dot:"."? "]" { return { name: name + (dot ?? '') } }
  / name:Path dot:"."? { return { name: name + (dot ?? '') } }
  / dots:"."|1..2| { return { name: dots.join('') } }
  / "??" { return { name: '??' } }

Path
  = dot:"."? head:Any tail:PathTail* { return  (dot ?? '') + head + tail }
  
PathTail
  = "[" head:Any* "]" tail:PathTail* { return '[' + head + ']' + tail }
  / "." head:Any tail:PathTail* { return '.' + head + tail }

Any
  = head:[a-zA-Z0-9_\-!@#$%^&]+ { return head.join('') }
  / String

Number
  = sign:("-" / "+")? part:([1-9]+[0-9]*) frac:("." [0-9]+)? { return (parseInt(part[0].join('') + part[1].join('')) + (frac?.[1] ? parseInt(frac?.[1].join('')) / 10 ** (frac?.[1].join('').length) : 0)) * (sign === '-' ? -1 : 1) }
  / "0" frac:("." [0-9]+)? { return (frac?.[1] ? parseInt(frac?.[1].join('')) / 10 ** (frac?.[1].join('').length) : 0) }

NumberOrNothing
  = Number
  / "" { return null }
 
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