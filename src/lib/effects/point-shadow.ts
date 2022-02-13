import { Compiler } from '../compiler';
import { FloatNode, Sampler2DNode, Vec2Node, Vec4Node } from '../types';


export class GetPointShadowNode extends FloatNode {
  constructor(
    private shadowMap: Sampler2DNode,
    private shadowMapSize: Vec2Node,
    private shadowBias: FloatNode,
    private shadowRadius: FloatNode,
    private shadowCoord: Vec4Node,
    private shadowCameraNear: FloatNode,
    private shadowCameraFar: FloatNode,
  ) { super() }
  public compile(c: Compiler) {

    return {
      pars: `
      #ifndef LIGHT_PARS
      #define LIGHT_PARS
      const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)

      const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
      const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

      float unpackRGBAToDepth( const in vec4 v ) {
        return dot( v, UnpackFactors );
      }
      float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
        return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
      }
      #endif

	    vec2 cubeToUV( vec3 v, float texelSizeY ) {

        // Number of texels to avoid at the edge of each square

        vec3 absV = abs( v );

        // Intersect unit cube

        float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
        absV *= scaleToCube;

        // Apply scale to avoid seams

        // two texels less per square (one texel will do for NEAREST)
        v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );

        // Unwrap

        // space: -1 ... 1 range for each square
        //
        // #X##		dim    := ( 4 , 2 )
        //  # #		center := ( 1 , 1 )

        vec2 planar = v.xy;

        float almostATexel = 1.5 * texelSizeY;
        float almostOne = 1.0 - almostATexel;

        if ( absV.z >= almostOne ) {

          if ( v.z > 0.0 )
            planar.x = 4.0 - v.x;

        } else if ( absV.x >= almostOne ) {

          float signX = sign( v.x );
          planar.x = v.z * signX + 2.0 * signX;

        } else if ( absV.y >= almostOne ) {

          float signY = sign( v.y );
          planar.x = v.x + 2.0 * signY + 2.0;
          planar.y = v.z * signY - 2.0;

        }

        // Transform to UV space

        // scale := 0.5 / dim
        // translate := ( center + 0.5 ) / dim
        return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );

      }
      float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {

          vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );

          // for point lights, the uniform @vShadowCoord is re-purposed to hold
          // the vector from the light to the world-space position of the fragment.
          vec3 lightToPosition = shadowCoord.xyz;

          // dp = normalized distance from light to fragment position
          float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear ); // need to clamp?
          dp += shadowBias;

          // bd3D = base direction 3D
          vec3 bd3D = normalize( lightToPosition );

          #if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )

            vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;

            return (
              texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
              texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
              texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
              texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
              texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
              texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
              texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
              texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
              texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
            ) * ( 1.0 / 9.0 );

          #else // no percentage-closer filtering

            return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );

          #endif
    
      }
      `,
      out: `getPointShadow(${c.get(this.shadowMap)}, ${c.get(this.shadowMapSize)}, ${c.get(this.shadowBias)}, ${c.get(this.shadowRadius)}, ${c.get(this.shadowCoord)}, ${c.get(this.shadowCameraNear)}, ${c.get(this.shadowCameraFar)})`
    }
  }

}

/**
 * 
 */