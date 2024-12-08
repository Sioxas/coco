import { HStack, renderRoot, VStack, Text, Image } from './core/components';
import { defineComponent } from './core/render';

import './style.css';

const Fragement = defineComponent(
  function (children: () => void) {
    children();
  }
);

type StringOrNumberFieldKeys<T> = {
  [K in keyof T]: T[K] extends string | number ? K : never;
}[keyof T];

export const List = defineComponent(
  function <T>(
    dataSource: T[],
    key: StringOrNumberFieldKeys<T> | ((item: T) => string | number),
    renderItem: (item: T) => void
  ) {
    return VStack(() => {
      for (const item of dataSource) {
        const itemKey = typeof key === 'function' ? key(item) : item[key] as string | number;
        Fragement(() => { renderItem(item); }).key(itemKey);
      }
    });
  }
);


interface Option {
  label: string;
  value: string | number;
}

const options: Option[] = [
  { label: 'Option 1', value: '1' },
  { label: 'Option 2', value: '2' },
  { label: 'Option 3', value: '3' },
];

const root = document.querySelector<HTMLElement>('#app');

renderRoot(root!, () => {
  VStack(() => {
    HStack(() => {
      Text('Hello, ').style({ color: 'red' });
      Text('World!').style({ color: 'blue' });
    });

    HStack(() => {
      Image('./vite.svg');
    });
  }).style({ justifyContent: 'center', alignItems: 'center' })
    .gap('10px');

  List(options, 'value', (option) => {
    HStack(() => {
      Text(option.label).style({ color: 'green' });
      Text(option.value.toString()).style({ color: 'purple' });
    }).gap('10px');
  });
});
