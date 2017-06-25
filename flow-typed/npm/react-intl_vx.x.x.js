declare type reactIntl$MessageDescriptor = {
  id: string,
  defaultMessage?: string,
  description?: string | Object,
}
declare type reactIntl$DateTimeFormatOptions = {
  localeMatcher?: 'best fit' | 'lookup',
  formatMatcher?: 'basic' | 'best fit',
  timeZone?: string,
  hour12?: boolean,
  weekday?: 'narrow' | 'short' | 'long',
  era?: 'narrow' | 'short' | 'long',
  year?: 'numeric' | '2-digit',
  month?: 'numeric' | '2-digit' | 'narrow' | 'short' | 'long',
  day?: 'numeric' | '2-digit',
  hour?: 'numeric' | '2-digit',
  minute?: 'numeric' | '2-digit',
  second?: 'numeric' | '2-digit',
  timeZoneName?: 'short' | 'long',
}

declare type reactIntl$LocaleData = {
  locale: string,
  [string]: any
}

declare module 'react-intl' {
  declare export function injectIntl<DP, P, S> (component: Class<React$Component<DP, P, S>>): Class<React$Component<DP, $Diff<P, { intl: any }>, S>>

  declare export function injectIntl<DP, P, S> (component: (props: P) => ?React$Element<any>): Class<React$Component<DP, $Diff<P, { intl: any }>, S>>

  declare export function addLocaleData(data: reactIntl$LocaleData | reactIntl$LocaleData[]): void

  declare export class FormattedMessage extends React$Component {
    props: reactIntl$MessageDescriptor & {
      values?: { [string]: number | string | React$Element<*> },
      tagName?: string,
      children?: (...formattedMessage: React$Element<*>[]) => React$Element<*>,
    }
  }
  declare export class FormattedHTMLMessage extends React$Component {
    props: reactIntl$MessageDescriptor & {
      values?: { [string]: string },
      tagName?: string,
      children?: (...formattedMessage: React$Element<*>[]) => React$Element<*>,
    }
  }
  declare export class FormattedDate extends React$Component {
    props: reactIntl$DateTimeFormatOptions & {
      value: any,
      format?: string,
      children?: (formattedDate: string) => React$Element<*>
    }
  }
  declare export class IntlProvider extends React$Component {
    props: {
      locale?: string,
      formats?: Object,
      messages?: {[string]: string},
      defaultLocale?: string,
      defaultFormats?: Object,
      textComponent?: Class<React$Component<*,*,*>>
    }
  }
}
