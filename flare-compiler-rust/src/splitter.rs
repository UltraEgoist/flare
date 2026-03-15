use regex::Regex;

use crate::ast::{Block, BlockType};

/// Phase 1: Split source into blocks (meta, script, template, style).
pub fn split_blocks(source: &str) -> Vec<Block> {
    let re = Regex::new(r"<(meta|script|template|style)(\s[^>]*)?>(?s)(.*?)</\1>").unwrap();
    let mut blocks = Vec::new();

    for cap in re.captures_iter(source) {
        let block_type = match &cap[1] {
            "meta" => BlockType::Meta,
            "script" => BlockType::Script,
            "template" => BlockType::Template,
            "style" => BlockType::Style,
            _ => continue,
        };

        let content = cap[3].to_string();
        let start_line = source[..cap.get(0).unwrap().start()]
            .chars()
            .filter(|&c| c == '\n')
            .count()
            + 1;

        blocks.push(Block {
            block_type,
            content,
            start_line,
        });
    }

    blocks
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_split_basic() {
        let src = r#"<meta>
  name: "x-hello"
  shadow: open
</meta>
<script>
  state count: number = 0
</script>
<template>
  <div>{{ count }}</div>
</template>
<style>
  div { color: red; }
</style>"#;
        let blocks = split_blocks(src);
        assert_eq!(blocks.len(), 4);
        assert_eq!(blocks[0].block_type, BlockType::Meta);
        assert_eq!(blocks[1].block_type, BlockType::Script);
        assert_eq!(blocks[2].block_type, BlockType::Template);
        assert_eq!(blocks[3].block_type, BlockType::Style);
    }

    #[test]
    fn test_split_no_script() {
        let src = r#"<meta>
  name: "x-test"
  shadow: open
</meta>
<template>
  <div>Hello</div>
</template>"#;
        let blocks = split_blocks(src);
        assert_eq!(blocks.len(), 2);
    }
}
