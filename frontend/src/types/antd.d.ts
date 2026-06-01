import 'antd';
import type { CardProps, CardGridProps, CardMetaProps } from 'antd/es/card';
import * as React from 'react';

declare module 'antd' {
  export const Card: React.FC<CardProps> & {
    Grid: React.FC<CardGridProps>;
    Meta: React.FC<CardMetaProps>;
  };
}
