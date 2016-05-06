/**
 * Created by budde on 05/05/16.
 */
var _ = require('lodash')
/**
 * @typedef {{type: string, value: string=}} Token
 */
/**
 * Lex a a given validation type.
 * @param {string} type
 * @return {Token[]}
 */
function lexValidateType (type) {
  type += '\u0000'
  return type.split('').reduce((results, char) => {
    if (/[a-z-_0-9]/i.exec(char)) {
      results.buffer += char
      return results
    }
    if (!/[() \u0000]/.exec(char)) throw new Error('Syntax error: Invalid character ' + char)
    if (results.buffer) {
      switch (results.buffer) {
        case 'and':
          results.tokens.push({type: 'AND'})
          break
        case 'or':
          results.tokens.push({type: 'OR'})
          break
        default:
          results.tokens.push({type: 'VALIDATOR', value: results.buffer})
      }
      results.buffer = ''
    }
    switch (char) {
      case '(':
        results.tokens.push({type: 'L_PAREN'})
        break
      case ')':
        results.tokens.push({type: 'R_PAREN'})
        break
    }
    return results
  }, {buffer: '', tokens: []}).tokens
}

class AstNode {

  /**
   * @param {string} type
   * @param {Token} token
   */
  constructor (type, token) {
    this.type = type
    this.token = token
  }

  generateValidator (validators) {
    throw new Error('Not yet implemented')
  }
}

class ValidatorAstNode extends AstNode {

  constructor (token) {
    super('VALIDATOR', token)
  }

  generateValidator (validators) {
    var type = this.token.value
    if (!validators[type]) throw new Error('Invalid validator: ' + type)
    return validators[type]
  }
}

class BinaryAstNode extends AstNode {

  /**
   * @param {string} type
   * @param {Token} token
   * @param {AstNode} left
   * @param {AstNode} right
   */
  constructor (type, token, left, right) {
    super(type, token)
    this.left = left
    this.right = right
  }
}

class AndAstNode extends BinaryAstNode {

  /**
   * @param {Token} token
   * @param {AstNode} left
   * @param {AstNode} right
   */
  constructor (token, left, right) {
    super('AND', token, left, right)
  }

  generateValidator (validators) {
    return (formDecorator, input) =>
      this.left.generateValidator(validators)(formDecorator, input).then((left) => {
        if (!left) return false
        return this.right.generateValidator(validators)(formDecorator, input)
      })
  }
}

class OrAstNode extends BinaryAstNode {

  /**
   * @param {Token} token
   * @param {AstNode} left
   * @param {AstNode} right
   */
  constructor (token, left, right) {
    super('OR', token, left, right)
  }

  generateValidator (validators) {
    return (formDecorator, input) =>
      this.left.generateValidator(validators)(formDecorator, input).then((left) => {
        if (left) return true
        return this.right.generateValidator(validators)(formDecorator, input)
      })
  }
}

var parseErrorUnexpectedToken = (unexpected, expected) => new Error(`Parse error: Unexpected token ${unexpected.type} expected ${expected}`)

/**
 * Parse a given token-list
 * @param {{type: string, value: string=}[]} tokens
 * @return {AstNode}
 */
function parseTokenList (tokens) {
  var firstToken = tokens[0]
  if (!firstToken) throw new Error('Parse error: Invalid input')
  if (tokens.length === 1) {
    if (firstToken.type !== 'VALIDATOR') throw parseErrorUnexpectedToken(firstToken, 'VALIDATOR')
    return new ValidatorAstNode(firstToken)
  }

  var lastToken = tokens[tokens.length - 1]
  if (firstToken.type === 'L_PAREN' && lastToken.type === 'R_PAREN') {
    return parseTokenList(_.slice(tokens, 1, tokens.length - 1))
  }

  var left = (key) => parseTokenList(_.slice(tokens, 0, key))
  var right = (key) => parseTokenList(_.slice(tokens, key + 1))

  var findBinary = (type, Node) => {
    var paren = 0
    for (let key = 0; key < tokens.length; key++) {
      let token = tokens[key]
      switch (token.type) {
        case 'L_PAREN':
          paren++
          break
        case 'R_PAREN':
          paren--
          break
        case type:
          if (!paren) return new Node(token, left(key), right(key))
      }
    }
  }

  var binary = findBinary('OR', OrAstNode) || findBinary('AND', AndAstNode)
  if (binary) return binary
  throw new Error('Parse error: Invalid input')
}

var parseCache = {}

/**
 * @paren {string} type
 * @return {AstNode}
 */
function parse (type) {
  if (parseCache.hasOwnProperty(type)) return parseCache[type]
  parseCache[type] = parseTokenList(lexValidateType(type))
  return parseCache[type]
}

module.exports = {
  lexValidationType: lexValidateType,
  parseTokenList: parseTokenList,
  parse: parse
}
