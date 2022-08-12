import React, { useState } from 'react'

import './style.css'

//  ---------------------------------

export default function ({ rules, currRule, onRuleClick }) {

  return (
    <div className="w-full border subtle-border overflow-auto">
      <table className="w-full bg-gray-400 bg-opacity-25 py-1 px-3 text-lg">
        <thead className="border-b subtle-border text-accent-contrast">
          <tr className="bg-gray-400/50">
            <th className="text-left pl-3">Rule Name</th>
          </tr>
        </thead>
        <tbody className="">
          {(rules || []).map(rule => (
            <tr
              className="border-t subtle-border cursor-pointer"
              key={rule.uuid || 'new-rule'}
              onClick={() => {
                onRuleClick(rule)
              }}
            >
              <td className={`py-2 px-4${rule === currRule ? ' font-bold' : ''}`}>
                {rule.uuid ? '' : '* '}{rule.name}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
