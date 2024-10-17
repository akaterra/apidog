// @apiParam [(group)] [{type=type}] [field[=defaultValue]] description

start
  = group:Group? _ type:Type? _ field:Field description:Description? { return { group, type, field, description } }

Group
  = "(" _ name:Any _ ")" { return { name } }

Type
  = "{" _ name:Any constraints:TypeConstraints? modifiers:TypeModifiers* _ e:TypeEnum? "}" { return { name, modifiers, enum: e, ...constraints } }

TypeModifiers
  = ":" name:Any list:"[]"* constraints:TypeConstraints? { return { name, list: list.length, ...constraints } }
  / list:"[]"+ constraints:TypeConstraints? { return { name: null, list: list.length, ...constraints } }

TypeConstraints
  = "{" _ min:NumberOrNothing _ delim:("-" / "..") _ max:NumberOrNothing _ "}" { return { min, max, isNumeric: delim === '-' } }

TypeEnum
  = "=" head:(Any)|1..,","| { return head }

Field
  = "[" _ name:Path defaultValue:FieldDefaultValue? "]" { return { name, defaultValue: defaultValue ?? undefined, isRequired: false } }
  / name:Path defaultValue:FieldDefaultValue? { return { name, defaultValue: defaultValue ?? undefined, isRequired: true } }

FieldDefaultValue
  = "=" head:Any { return head } 

Description
  = [ \t]+ description:.* { return description.join('') }

Path
  = head:Any tail:PathTail* { return head + tail }

PathTail
  = "[" head:Any* "]" tail:PathTail* { return '[' + head + ']' + tail }
  / "." head:Any tail:PathTail* { return '.' + head + tail }

Any
  = head:[a-zA-Z0-9_-]+ { return head.join('') }
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