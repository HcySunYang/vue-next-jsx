import * as bt from '@babel/types'
import { NodePath } from '@babel/traverse'
import { TagType, AttributePaths } from './buildCreateVNode'
import { throwError, ErrorCodes } from './errors'

export const typedVmodelRE = /^vModel/

export function buildPropsForTypedVmodel(
  attr: bt.JSXAttribute,
  attrPath: NodePath<bt.JSXAttribute>,
  attrPaths: AttributePaths,
  tag: Exclude<TagType, bt.NullLiteral>
) {
  if (!bt.isJSXExpressionContainer(attr.value)) {
    throwError(attrPath, ErrorCodes.X_INVALIDE_V_MODEL_VALUE)
  }

  if (bt.isStringLiteral(tag)) {
    const tagName = tag.value
    // Intrinaic elements: input select textarea
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    } else {
      throwError(attrPath, ErrorCodes.X_V_MODEL_ON_INVALID_ELEMENT)
    }
  } else {
    // component
  }
}
