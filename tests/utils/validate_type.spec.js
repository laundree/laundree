/**
 * Created by budde on 05/05/16.
 */

var validateType = require('../../utils/validate_type')
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()
var expect = chai.expect
describe('unit', () => {
  describe('validateType', () => {
    describe('lexValidateType', () => {
      it('should lex a single validator', () => validateType.lexValidationType('bob').should.be.deep.equal([{
        type: 'VALIDATOR',
        value: 'bob'
      }]))

      it('should lex parenthesis', () => validateType.lexValidationType(')bob (').should.be.deep.equal(
        [{type: 'R_PAREN'}, {type: 'VALIDATOR', value: 'bob'}, {type: 'L_PAREN'}]))

      it('should lex and', () => validateType.lexValidationType(')bob and alice(').should.be.deep.equal(
        [{type: 'R_PAREN'},
          {type: 'VALIDATOR', value: 'bob'},
          {type: 'AND'},
          {type: 'VALIDATOR', value: 'alice'},
          {type: 'L_PAREN'}]))

      it('should lex or', () => validateType.lexValidationType(')bob or    alice(').should.be.deep.equal(
        [{type: 'R_PAREN'},
          {type: 'VALIDATOR', value: 'bob'},
          {type: 'OR'},
          {type: 'VALIDATOR', value: 'alice'},
          {type: 'L_PAREN'}]))

      it('should error on invalid char', () => expect(() => validateType.lexValidationType('%')).to.throw('Syntax error: Invalid character %'))
    })

    function parse (string) {
      return validateType.parseTokenList(validateType.lexValidationType(string))
    }

    describe('parseTokenList', () => {
      it('should parse a single validator', () => parse('bob').should.deep.equal({
        type: 'VALIDATOR',
        token: {type: 'VALIDATOR', value: 'bob'}
      }))

      it('should fail on lone parenthesis', () => expect(() => parse('(')).to.throw('Parse error: Unexpected token L_PAREN expected VALIDATOR'))

      it('should parse and', () => parse('bob and alice').should.deep.equal({
        type: 'AND',
        token: {type: 'AND'},
        left: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'bob'}},
        right: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'alice'}}
      }))

      it('should parse or', () => parse('bob or alice').should.deep.equal({
        type: 'OR',
        token: {type: 'OR'},
        left: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'bob'}},
        right: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'alice'}}
      }))

      it('should parse and right', () => parse('bob and alice and charles').should.deep.equal(
        {
          type: 'AND',
          token: {type: 'AND'},
          left: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'bob'}},
          right: {
            type: 'AND',
            token: {type: 'AND'},
            left: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'alice'}},
            right: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'charles'}}
          }
        }))

      it('should parse `and` and `or` precedence right', () => parse('bob or alice and charles').should.deep.equal(
        {
          type: 'OR',
          token: {type: 'OR'},
          left: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'bob'}},
          right: {
            type: 'AND',
            token: {type: 'AND'},
            left: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'alice'}},
            right: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'charles'}}
          }
        }))

      it('should parse `and` and `or` precedence right 2', () => parse('bob and alice or charles').should.deep.equal(
        {
          type: 'OR',
          token: {type: 'OR'},
          left: {
            type: 'AND',
            token: {type: 'AND'},
            left: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'bob'}},
            right: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'alice'}}
          },
          right: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'charles'}}
        }))

      it('should unwrap parenthesis', () => parse('(bob)').should.deep.equal(parse('bob')))

      it('should respect parenthesis', () => parse('bob and (alice or charlie)').should.deep.equal(
        {
          type: 'AND',
          token: {type: 'AND'},
          left: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'bob'}},
          right: {
            type: 'OR',
            token: {type: 'OR'},
            left: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'alice'}},
            right: {type: 'VALIDATOR', token: {type: 'VALIDATOR', value: 'charlie'}}
          }
        }
      ))

      it('should not fail', () => parse('(alice or charlie) and bob'))

      it('should fail on lone parenthesis', () => expect(() => parse('( asd')).to.throw('Parse error: Invalid input'))

      it('should fail on empty input', () => expect(() => parse('')).to.throw('Parse error: Invalid input'))
    })

    describe('parse', () => {
      it('should work', () => validateType.parse('bob').should.deep.equal(parse('bob')))

      it('should cache', () => validateType.parse('bob').should.equal(validateType.parse('bob')))
    })

    describe('AstNode', () => {
      describe('generateValidator', () => {
        it('should generate validator', () => {
          var validators = {true: () => Promise.resolve(true), false: () => Promise.resolve(false)}
          // noinspection BadExpressionStatementJS
          return validateType.parse('(false or true) and true').generateValidator(validators)().should.eventually.be.true
        })
        it('should generate validator', () => {
          var validators = {true: () => Promise.resolve(true), false: () => Promise.resolve(false)}
          // noinspection BadExpressionStatementJS
          return validateType.parse('(true or false) and false').generateValidator(validators)().should.eventually.be.false
        })
      })
    })
  })
})
