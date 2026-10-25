import React from 'react';

interface RazorLogoIconProps {
  className?: string;
  size?: number | string;
  light?: boolean;
}

export const RazorLogoIcon: React.FC<RazorLogoIconProps> = ({
  className = '',
  size = 28,
  light = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="Navalha Logo"
    >
      <defs>
        <linearGradient
          id={`bladeSpine-${light ? 'light' : 'dark'}`}
          x1="160"
          y1="180"
          x2="350"
          y2="340"
          gradientUnits="userSpaceOnUse"
        >
          {light ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#383838" />
              <stop offset="45%" stopColor="#141414" />
              <stop offset="100%" stopColor="#050505" />
            </>
          )}
        </linearGradient>

        <linearGradient
          id={`bladeEdge-${light ? 'light' : 'dark'}`}
          x1="180"
          y1="210"
          x2="300"
          y2="310"
          gradientUnits="userSpaceOnUse"
        >
          {light ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#94a3b8" />
              <stop offset="70%" stopColor="#475569" />
              <stop offset="100%" stopColor="#1e293b" />
            </>
          )}
        </linearGradient>

        <radialGradient
          id={`fluidGloss-${light ? 'light' : 'dark'}`}
          cx="30%"
          cy="30%"
          r="70%"
        >
          {light ? (
            <>
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#2e2e2e" />
              <stop offset="55%" stopColor="#121212" />
              <stop offset="100%" stopColor="#000000" />
            </>
          )}
        </radialGradient>
      </defs>

      {/* Outer circular organic fluid wreath */}
      <path
        d="M 256 46
           C 310 46, 362 70, 400 108
           C 414 122, 427 138, 436 156
           C 445 174, 439 190, 432 205
           C 426 218, 423 232, 429 246
           C 437 266, 434 282, 423 300
           C 414 290, 410 274, 414 258
           C 418 244, 418 232, 411 220
           C 402 204, 404 186, 414 172
           C 422 160, 418 144, 406 132
           C 375 100, 332 80, 288 75
           C 258 72, 226 76, 198 86
           C 188 90, 180 82, 188 74
           C 208 55, 232 46, 256 46 Z"
        fill={`url(#fluidGloss-${light ? 'light' : 'dark'})`}
      />

      <path
        d="M 436 280
           C 448 310, 442 344, 424 374
           C 400 414, 358 444, 310 456
           C 272 465, 230 460, 194 444
           C 168 432, 144 414, 126 390
           C 118 380, 126 370, 136 376
           C 152 386, 170 398, 190 406
           C 226 420, 268 424, 306 414
           C 344 404, 378 380, 400 348
           C 412 330, 418 310, 414 288
           C 412 278, 428 268, 436 280 Z"
        fill={`url(#fluidGloss-${light ? 'light' : 'dark'})`}
      />

      <path
        d="M 194 444
           C 158 434, 126 410, 104 378
           C 84 348, 76 312, 78 276
           C 80 242, 92 210, 92 176
           C 92 154, 82 136, 74 118
           C 70 110, 80 102, 88 108
           C 102 126, 114 146, 114 170
           C 114 198, 102 226, 98 254
           C 94 284, 102 316, 120 342
           C 138 368, 166 388, 196 400
           C 206 404, 204 420, 194 444 Z"
        fill={`url(#fluidGloss-${light ? 'light' : 'dark'})`}
      />

      {/* Tendrils and drips */}
      <path
        d="M 390 120 C 410 140, 430 170, 420 195 C 415 180, 400 160, 385 145 C 375 135, 380 125, 390 120 Z"
        fill={light ? '#ffffff' : '#000000'}
      />
      <path
        d="M 445 220 C 460 235, 455 255, 440 260 C 435 250, 438 238, 445 220 Z"
        fill={light ? '#cbd5e1' : '#111111'}
      />
      <path
        d="M 425 350 C 440 370, 430 395, 410 405 C 412 390, 418 375, 425 350 Z"
        fill={light ? '#e2e8f0' : '#050505'}
      />
      <path
        d="M 140 410 C 120 425, 105 405, 115 390 C 122 398, 130 405, 140 410 Z"
        fill={light ? '#cbd5e1' : '#050505'}
      />
      <path
        d="M 85 150 C 70 135, 85 110, 102 118 C 94 128, 88 138, 85 150 Z"
        fill={light ? '#ffffff' : '#000000'}
      />

      {/* Straight Razor Tang Tail (topo direito) */}
      <path
        d="M 315 145
           C 330 130, 350 115, 368 120
           C 382 125, 386 142, 375 154
           C 362 168, 345 178, 332 188
           C 322 178, 318 160, 315 145 Z"
        fill={`url(#bladeSpine-${light ? 'light' : 'dark'})`}
      />

      {/* Tang Highlight */}
      <path
        d="M 335 140 C 350 128, 365 124, 374 132 C 378 136, 374 144, 365 152"
        stroke={light ? '#ffffff' : '#94a3b8'}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Scales / Handle (Cabo) */}
      <path
        d="M 310 185
           C 295 210, 275 250, 248 295
           C 225 335, 200 375, 172 405
           C 158 420, 138 426, 124 416
           C 112 406, 116 386, 128 368
           C 152 334, 184 288, 218 240
           C 246 200, 278 168, 305 162
           C 312 168, 312 178, 310 185 Z"
        fill={`url(#fluidGloss-${light ? 'light' : 'dark'})`}
      />

      {/* Handle Highlight line */}
      <path
        d="M 298 175 C 265 215, 230 265, 195 315 C 165 358, 140 395, 130 405"
        stroke={light ? '#ffffff' : '#666666'}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Razor Blade Body */}
      <path
        d="M 312 165
           L 165 268
           C 155 275, 145 272, 140 262
           L 132 248
           C 128 240, 132 230, 142 222
           L 288 120
           C 298 112, 310 118, 315 128
           L 322 145
           C 325 152, 320 160, 312 165 Z"
        fill={`url(#bladeSpine-${light ? 'light' : 'dark'})`}
      />

      {/* Cutting Edge Bevel */}
      <path
        d="M 302 160
           L 162 258
           C 158 261, 154 260, 152 256
           L 148 248
           C 146 244, 148 240, 152 237
           L 292 138
           C 296 135, 300 136, 302 140
           L 306 148
           C 308 152, 306 157, 302 160 Z"
        fill={`url(#bladeEdge-${light ? 'light' : 'dark'})`}
      />

      {/* Sharp razor mirror edge */}
      <path
        d="M 152 256 L 302 152"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Spine top line */}
      <path
        d="M 142 222 L 288 120"
        stroke={light ? '#ffffff' : '#000000'}
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Pivot screw pin */}
      <circle cx="308" cy="175" r="5" fill={light ? '#ffffff' : '#94a3b8'} />
      <circle cx="308" cy="175" r="2.5" fill={light ? '#000000' : '#171717'} />

      {/* Fluid Vines wrapping over blade */}
      <path
        d="M 315 158 C 325 170, 335 190, 325 205 C 318 200, 316 185, 312 172 Z"
        fill={light ? '#ffffff' : '#050505'}
      />
      <path
        d="M 230 270 C 245 260, 260 275, 252 290 C 240 300, 222 288, 230 270 Z"
        fill={light ? '#e2e8f0' : '#111111'}
      />
    </svg>
  );
};
