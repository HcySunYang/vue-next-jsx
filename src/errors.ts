import { NodePath } from '@babel/traverse'

export const enum ErrorCodes {
  X_V_MODEL_ON_INVALID_ELEMENT,
  X_INVALIDE_TAG,
  X_INVALIDE_V_MODEL_VALUE,
  X_INVALIDE_V_MODEL_ARGS,
  X_MISSING_V_MODEL_ARGS,
  X_V_MODEL_ARG_ON_ELEMENT,
  X_V_MODEL_ON_FILE_INPUT_ELEMENT,
  X_V_MODEL_UNNECESSARY_VALUE,
  X_INVALIDE_V_HTML_VALUE,
  X_INVALIDE_V_SHOW_VALUE,
  X_INVALIDE_V_TEXT_VALUE,
  X_INVALIDE_V_ON_VALUE,
  X_INVALIDE_V_ON_NAME,
  X_MISSING_V_ON_NAME
}

export const ErrorMsg = {
  [ErrorCodes.X_V_MODEL_ON_INVALID_ELEMENT]:
    'v-model can only be used on <input>, <textarea> and <select> elements.',
  [ErrorCodes.X_INVALIDE_TAG]: 'Unsupported tag type.',
  [ErrorCodes.X_INVALIDE_V_MODEL_VALUE]:
    'Only JSXExpressionContainer can be used as the value of v-model/vModel.',
  [ErrorCodes.X_INVALIDE_V_MODEL_ARGS]: 'Invalid v-model/vModel arguments.',
  [ErrorCodes.X_MISSING_V_MODEL_ARGS]: 'Missing v-model/vModel arguments.',
  [ErrorCodes.X_V_MODEL_ARG_ON_ELEMENT]:
    'v-model argument is not supported on plain elements.',
  [ErrorCodes.X_V_MODEL_ON_FILE_INPUT_ELEMENT]:
    'v-model cannot used on file inputs since they are read-only. Use a v-on:change listener instead.',
  [ErrorCodes.X_V_MODEL_UNNECESSARY_VALUE]: `Unnecessary value binding used alongside v-model. It will interfere with v-model's behavior.`,
  [ErrorCodes.X_INVALIDE_V_HTML_VALUE]:
    'Only JSXExpressionContainer can be used as the value of v-html/vHtml.',
  [ErrorCodes.X_INVALIDE_V_SHOW_VALUE]:
    'Only JSXExpressionContainer can be used as the value of v-show/vShow.',
  [ErrorCodes.X_INVALIDE_V_TEXT_VALUE]:
    'Only JSXExpressionContainer can be used as the value of v-text/vText.',
  [ErrorCodes.X_INVALIDE_V_ON_VALUE]:
    'Only JSXExpressionContainer can be used as the value of v-on/vOn.',
  [ErrorCodes.X_INVALIDE_V_ON_NAME]: 'Invalid event name',
  [ErrorCodes.X_MISSING_V_ON_NAME]: 'Missing event name'
}

export function throwError(path: NodePath<any>, errorCode: ErrorCodes): never {
  throw path.buildCodeFrameError(ErrorMsg[errorCode])
}
