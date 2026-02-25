import Image, { ImageProps } from 'next/image';

type AppImageProps = Omit<ImageProps, 'src' | 'alt'> & {
  src: string;
  alt: string;
};

const AppImage: React.FC<AppImageProps> = ({ src, alt, width = 1200, height = 1200, ...props }) => (
  <Image
    src={src}
    alt={alt}
    width={width}
    height={height}
    unoptimized
    {...props}
  />
);

export default AppImage;
