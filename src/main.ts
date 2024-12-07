
import './style.css';
import { HStack, renderRoot, VStack, Text, Image } from './core/components';

const root = document.querySelector<HTMLElement>('#app');

renderRoot(root!, () => {
  VStack(() => {
    HStack(() => {
      Text('Hello, ').style({ color: 'red' });
      Text('World!').style({ color: 'blue' });
    });

    HStack(() => {
      Image('./vite.svg')
    });
  })
  .style({ justifyContent: 'center', alignItems: 'center' })
  .gap('10px');
});
