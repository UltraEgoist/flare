use crate::ast::FlareType;

/// Parse a type annotation string into a FlareType AST node.
pub fn parse_type(raw: &str) -> FlareType {
    let s = raw.trim();

    // Array: T[]
    if s.ends_with("[]") {
        return FlareType::Array {
            element: Box::new(parse_type(&s[..s.len() - 2])),
        };
    }

    // Union: A | B
    if s.contains('|') && !s.starts_with('{') {
        let types = s
            .split('|')
            .map(|p| {
                let t = p.trim();
                if t.starts_with('"') || t.starts_with('\'') {
                    FlareType::Literal {
                        value: t.replace(&['"', '\''][..], ""),
                    }
                } else {
                    parse_type(t)
                }
            })
            .collect();
        return FlareType::Union { types };
    }

    // Primitives
    match s {
        "string" | "number" | "boolean" | "void" | "null" | "undefined" | "any" | "never"
        | "unknown" | "object" | "bigint" | "symbol" => {
            return FlareType::Primitive {
                name: s.to_string(),
            };
        }
        _ => {}
    }

    // Literal string
    if s.starts_with('"') || s.starts_with('\'') {
        return FlareType::Literal {
            value: s.replace(&['"', '\''][..], ""),
        };
    }

    // Object literal: { field: Type, ... }
    if s.starts_with('{') && s.ends_with('}') {
        let inner = &s[1..s.len() - 1].trim();
        let mut fields = Vec::new();
        for fp in inner.split(',').map(|f| f.trim()).filter(|f| !f.is_empty()) {
            let re = regex::Regex::new(r"^(\w+)(\?)?\s*:\s*(.+)$").unwrap();
            if let Some(m) = re.captures(fp) {
                fields.push(crate::ast::ObjectField {
                    name: m[1].to_string(),
                    field_type: parse_type(&m[3]),
                    optional: m.get(2).map_or(false, |v| v.as_str() == "?"),
                });
            }
        }
        return FlareType::Object { fields };
    }

    // Fallback: treat as named type (primitive-like)
    FlareType::Primitive {
        name: s.to_string(),
    }
}

/// Convert a FlareType to a TypeScript type string.
pub fn type_to_ts(t: &FlareType) -> String {
    match t {
        FlareType::Primitive { name } => name.clone(),
        FlareType::Array { element } => format!("{}[]", type_to_ts(element)),
        FlareType::Union { types } => types.iter().map(type_to_ts).collect::<Vec<_>>().join(" | "),
        FlareType::Literal { value } => format!("\"{}\"", value),
        FlareType::Object { fields } => {
            let fs: Vec<String> = fields
                .iter()
                .map(|f| {
                    format!(
                        "{}{}:{}",
                        f.name,
                        if f.optional { "?" } else { "" },
                        type_to_ts(&f.field_type)
                    )
                })
                .collect();
            format!("{{ {} }}", fs.join("; "))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_primitive() {
        match parse_type("string") {
            FlareType::Primitive { name } => assert_eq!(name, "string"),
            _ => panic!("Expected primitive"),
        }
    }

    #[test]
    fn test_parse_array() {
        match parse_type("string[]") {
            FlareType::Array { element } => match *element {
                FlareType::Primitive { name } => assert_eq!(name, "string"),
                _ => panic!("Expected primitive element"),
            },
            _ => panic!("Expected array"),
        }
    }

    #[test]
    fn test_parse_union() {
        match parse_type("string | number") {
            FlareType::Union { types } => assert_eq!(types.len(), 2),
            _ => panic!("Expected union"),
        }
    }

    #[test]
    fn test_type_to_ts() {
        let t = FlareType::Array {
            element: Box::new(FlareType::Primitive {
                name: "string".into(),
            }),
        };
        assert_eq!(type_to_ts(&t), "string[]");
    }
}
