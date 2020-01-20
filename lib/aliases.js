'use strict'

const TYPE_ALIASES = {
  'boolean': 'TINYINT',
  'number': 'DOUBLE',
  'string': 'VARCHAR',
  'array': 'JSON',
  'object': 'JSON',
}

module.exports = TYPE_ALIASES
