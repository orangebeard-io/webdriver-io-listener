import { Attribute, OrangebeardOptions} from './types'
import { Tag } from '@wdio/reporter/build/types';

module.exports = {
    getArrAttributesFromString(stringAttr) {
    return stringAttr
      ? stringAttr.split(';').map((attribute) => {
          const attributeArr = attribute.split(':');

          return {
            key: attributeArr.length === 1 ? null : attributeArr[0],
            value: attributeArr.length === 1 ? attributeArr[0] : attributeArr[1],
          };
        })
      : [];
  },

  getClientSettings(options: OrangebeardOptions = {}) {
    return {
      token: options.token,
      endpoint: [options.endpoint, 'listener', 'v2'].join('/'),
      launch: options.launch,
      project: options.project,
    };
  },

  getStartTestRun(options: OrangebeardOptions = {}) {
    return {
      launch: options.launch,
      description: options.description,
      attributes: this.getArrAttributesFromString(options.attributes),
      startTime: new Date().valueOf(),
    };
  },

  parseTags(tags: string[] | Tag[]): Attribute[] {
  return tags
    .map((item: string | Tag) => {
      if (typeof item === 'string') return null;
      const tag = item.name.slice(1);
      if (tag.includes(':')) {
        const [key, value] = tag.split(':');
        return { key, value };
      } else {
        return { value: tag };
      }
    })
    .filter(Boolean);
    },
}