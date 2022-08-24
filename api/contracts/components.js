
export const componentSchemas = {
  UserBase: {
    type: 'object',
    additionalProperties: false,
    properties: {
      email: {
        type: 'string',
        format: 'email'
      },
      lastName: {
        type: 'string'
      },
      firstName: {
        type: 'integer'
      },
      password: {
        type: 'string'
      },
      isActive: {
        type: 'boolean',
        description: 'User is Active/Suspended',
        default: true
      },
      role: {
        type: 'string',
        description: 'User\'s Role',
        default: 'user',
        enum: [
          'admin',
          'manager',
          'user',
          'zombie'
        ]
      },
    }
  },
  UserCreate: {
    allOf: [
      {
        $ref: '#/components/schemas/UserBase'
      },
      {
        type: 'object',
        required: ['email', 'lastName', 'firstName', 'password']
      }
    ]
  },
  UserRecord: {
    allOf: [
      {
        $ref: '#/components/schemas/UserBase'
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          uuid: {
            type: 'string',
            format: 'uuid'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          },
          lastLogin: {
            type: 'string',
            format: 'date-time'
          }
        }
      }
    ]
  },
  UserList: {
    type: 'array',
    item: {
      $ref: '#/components/schemas/UserRecord'
    }
  }

}


// User: {
//   type: 'object',
//     additionalProperties: false,
//       properties: {
//     uuid: {
//       type: 'string',
//         format: 'uuid'
//     },
//     email: {
//       type: 'string',
//         format: 'email'
//     },
//     lastName: {
//       type: 'string'
//     },
//     firstName: {
//       type: 'integer'
//     },
//     password: {
//       type: 'string'
//     },
//     isActive: {
//       type: 'boolean'
//     },
//     role: {
//       type: 'string',
//         description: 'User\'s Role',
//         default: 'user',
//         enum: [
//         'admin',
//         'manager',
//         'user',
//         'zombie'
//       ]
//     },
//     createdAt: {
//       type: 'string',
//         format: 'date-time'
//     },
//     updatedAt: {
//       type: 'string',
//         format: 'date-time'
//     },
//     lastLogin: {
//       type: 'string',
//         format: 'date-time'
//     }
//   }
// }
