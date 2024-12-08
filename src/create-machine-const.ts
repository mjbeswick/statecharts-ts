import { TSESLint, TSESTree } from '@typescript-eslint/utils';

const rule: TSESLint.RuleModule<'castAsConst', []> = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure objects passed to machineFactory are cast as const',
    },
    fixable: 'code',
    schema: [],
    messages: {
      castAsConst: 'Objects passed to machineFactory should be cast as const',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node: TSESTree.CallExpression) {
        // Check if the callee is machineFactory
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'machineFactory'
        ) {
          const args = node.arguments;
          if (args.length === 1) {
            const arg = args[0];
            // Check if the argument is an object literal
            if (arg.type === 'ObjectExpression') {
              context.report({
                node: arg,
                messageId: 'castAsConst',
                fix(fixer) {
                  return fixer.insertTextAfter(arg, ' as const');
                },
              });
            } else if (arg.type === 'TSAsExpression') {
              // Check if it's already cast as 'const'
              const typeNode = arg.typeAnnotation;
              if (
                typeNode.type !== 'TSTypeReference' ||
                (typeNode.typeName.type === 'Identifier' &&
                  typeNode.typeName.name !== 'const')
              ) {
                context.report({
                  node: arg,
                  messageId: 'castAsConst',
                  fix(fixer) {
                    const sourceCode = context.getSourceCode();
                    const argText = sourceCode.getText(arg.expression);
                    return fixer.replaceText(arg, `${argText} as const`);
                  },
                });
              }
            }
          }
        }
      },
    };
  },
};

export default rule;
