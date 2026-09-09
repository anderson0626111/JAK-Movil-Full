declare module 'react-native-vector-icons/Feather' {
  import { ComponentType } from 'react';

  const Feather: ComponentType<{
    name: string;
    size?: number;
    color?: string;
  }>;

  export default Feather;
}
