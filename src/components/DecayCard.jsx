import React from 'react';

export default function DecayCard({ width, height, image, seed, children, className = '' }) {
  return (
    <div
      className={`decay-card ${className}`}
      style={{
        width: width || '100%',
        height: height || '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'inherit'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'transform 0.4s ease',
        }}
        className="decay-card-bg"
      />
      {children}
    </div>
  );
};
