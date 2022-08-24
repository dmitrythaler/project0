export const createErrorResponse = (code, description) => ({
  [code]: {
    description,
    constent: {
      '*/*': {
        schema: {
          $ref: '#/components/schemas/APIError'
        }
      }
    }
  }
})

export const error400 = createErrorResponse(400, 'Missing or invalid request params')
export const error401 = createErrorResponse(401, 'Authentication error')
export const error403 = createErrorResponse(403, 'You are not authorized for this operation')
export const error500 = createErrorResponse(500, 'Internal server error')

export const createResponse = (code, description, data = {}) => ({
  [code]: {
    description,
    constent: {
      '*/*': {
        schema: {
          allOf : [
            {
              type: 'object',
              additionalProperties: false,
              required: ['code', 'meta'],
              properties: {
                code: {
                  type: 'number'
                },
                meta: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['createdAt', 'apiVersion', 'url', 'time'],
                  properties: {
                    createdAt: {
                      type: 'string',
                      format: 'date-time'
                    },
                    apiVersion: {
                      type: 'string'
                    },
                    url: {
                      type: 'string',
                      format: 'url'
                    },
                    time: {
                      type: 'number'
                    }
                  }
                }
              }
            },
            data
          ]
        }
      }
    }
  }
})
