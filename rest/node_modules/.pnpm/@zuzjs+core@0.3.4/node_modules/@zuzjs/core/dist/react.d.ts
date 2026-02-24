import { ReactNode, ReactElement, RefObject } from 'react';

declare const animateCSSVar: (ref: RefObject<HTMLElement>, variable: string, to: number, { lerpFactor, threshold, multiplier, }?: {
    lerpFactor?: number;
    threshold?: number;
    multiplier?: number;
}) => void;
declare const addPropsToChildren: (children: ReactNode, conditions: (child: ReactElement<any>) => boolean, getProps: (index: number, element: ReactElement<any>) => object) => ReactNode;

export { addPropsToChildren, animateCSSVar };
