import { uniforms } from '../common';
import { Compiler } from '../compiler';
import { varyingArray, vec4 } from '../dsl';
import { normalize } from '../functions';
import {
  uniformDirectionalLightShadows,
  uniformDirectionalShadowMap,
  uniformDirectionalShadowMatrix,
  uniformPointLightShadows,
  uniformPointShadowMap,
  uniformPointShadowMatrix,
  uniformSpotLightShadows,
  uniformSpotShadowMap,
  uniformSpotShadowMatrix,
} from '../lights';
import { transformed } from '../transformed';
import { FloatNode } from '../types';

export class ShadowMaskNode extends FloatNode {
  constructor() {
    super();
  }
  public compile(c: Compiler) {
    const k = c.variable();
    const worldPosition = uniforms.modelMatrix.multiplyVec(
      transformed.position
    );

    const shadowWorldNormal = normalize(
      vec4(transformed.normal, 0.0).multiplyMat(uniforms.viewMatrix).xyz()
    );

    // Need to reference the uniforms to ensure they are loaded
    c.get(uniformDirectionalLightShadows.map((i) => i));
    const directionalShadowMap = c.get(uniformDirectionalShadowMap);
    const directionalShadowCoords = uniformDirectionalLightShadows.map(
      (p, i) => {
        const shadowWorldPosition = worldPosition.add(
          vec4(shadowWorldNormal.multiplyScalar(p.shadowNormalBias), 0)
        );
        return uniformDirectionalShadowMatrix
          .get(i)
          .multiplyVec(shadowWorldPosition);
      }
    );
    const vDirectionalShadowCoord = c.get(
      varyingArray(directionalShadowCoords)
    );

    c.get(uniformSpotLightShadows.map((i) => i));
    const spotShadowMap = c.get(uniformSpotShadowMap);
    const spotShadowCoords = uniformSpotLightShadows.map((p, i) => {
      const shadowWorldPosition = worldPosition.add(
        vec4(shadowWorldNormal.multiplyScalar(p.shadowNormalBias), 0)
      );
      return uniformSpotShadowMatrix.get(i).multiplyVec(shadowWorldPosition);
    });
    const vSpotShadowCoord = c.get(varyingArray(spotShadowCoords));

    c.get(uniformPointLightShadows.map((i) => i));
    const pointShadowMap = c.get(uniformPointShadowMap);
    const pointShadowCoords = uniformPointLightShadows.map((p, i) => {
      const shadowWorldPosition = worldPosition.add(
        vec4(shadowWorldNormal.multiplyScalar(p.shadowNormalBias), 0)
      );
      return uniformPointShadowMatrix.get(i).multiplyVec(shadowWorldPosition);
    });
    const vPointShadowCoord = c.get(varyingArray(pointShadowCoords));

    return {
      pars: `
      const float UnpackDownscale = 255. / 256.; // 0..1 -> fraction (excluding 1)

      const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
      const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );

      float unpackRGBAToDepth( const in vec4 v ) {
        return dot( v, UnpackFactors );
      }
      float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {

        return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
    
      }
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
      float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {

        float shadow = 1.0;
    
        shadowCoord.xyz /= shadowCoord.w;
        shadowCoord.z += shadowBias;
    
        // if ( something && something ) breaks ATI OpenGL shader compiler
        // if ( all( something, something ) ) using this instead
    
        bvec4 inFrustumVec = bvec4 ( shadowCoord.x >= 0.0, shadowCoord.x <= 1.0, shadowCoord.y >= 0.0, shadowCoord.y <= 1.0 );
        bool inFrustum = all( inFrustumVec );
    
        bvec2 frustumTestVec = bvec2( inFrustum, shadowCoord.z <= 1.0 );
    
        bool frustumTest = all( frustumTestVec );
    
        if ( frustumTest ) {
                
          #if defined( SHADOWMAP_TYPE_PCF )

          vec2 texelSize = vec2( 1.0 ) / shadowMapSize;

          float dx0 = - texelSize.x * shadowRadius;
          float dy0 = - texelSize.y * shadowRadius;
          float dx1 = + texelSize.x * shadowRadius;
          float dy1 = + texelSize.y * shadowRadius;
          float dx2 = dx0 / 2.0;
          float dy2 = dy0 / 2.0;
          float dx3 = dx1 / 2.0;
          float dy3 = dy1 / 2.0;

          shadow = (
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
          ) * ( 1.0 / 17.0 );

        #elif defined( SHADOWMAP_TYPE_PCF_SOFT )

          vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
          float dx = texelSize.x;
          float dy = texelSize.y;

          vec2 uv = shadowCoord.xy;
          vec2 f = fract( uv * shadowMapSize + 0.5 );
          uv -= f * texelSize;

          shadow = (
            texture2DCompare( shadowMap, uv, shadowCoord.z ) +
            texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
            texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
            texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
            mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ), 
              texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
              f.x ) +
            mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ), 
              texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
              f.x ) +
            mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ), 
              texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
              f.y ) +
            mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ), 
              texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
              f.y ) +
            mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ), 
                  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
                  f.x ),
              mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ), 
                  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
                  f.x ),
              f.y )
          ) * ( 1.0 / 9.0 );

        #elif defined( SHADOWMAP_TYPE_VSM )

          shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );

        #else // no percentage-closer filtering:

          shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );

        #endif

        }
    
        return shadow;
    
      }
      float getShadowMask(bool receiveShadow) {

        float shadow = 1.0;
      
        #ifdef USE_SHADOWMAP
      
        #if NUM_DIR_LIGHT_SHADOWS > 0
      
        DirectionalLightShadow directionalLight;
      
        #pragma unroll_loop_start
        for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
          directionalLight = ${c.get(uniformDirectionalLightShadows)}[ i ];
          shadow *= receiveShadow ? getShadow( ${directionalShadowMap}[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, ${vDirectionalShadowCoord}[ i ]) : 1.0;
        }
        #pragma unroll_loop_end
      
        #endif
      
        #if NUM_SPOT_LIGHT_SHADOWS > 0
      
        SpotLightShadow spotLight;
      
        #pragma unroll_loop_start
        for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
      
          spotLight = ${c.get(uniformSpotLightShadows)}[ i ];
          shadow *= receiveShadow ? getShadow( ${spotShadowMap}[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, ${vSpotShadowCoord}[ i ] ) : 1.0;
      
        }
        #pragma unroll_loop_end
      
        #endif
      
        #if NUM_POINT_LIGHT_SHADOWS > 0
      
        PointLightShadow pointLight;
      
        #pragma unroll_loop_start
        for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
          pointLight = ${c.get(uniformPointLightShadows)}[ i ];
          shadow *= receiveShadow ? getPointShadow( ${pointShadowMap}[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, ${vPointShadowCoord}[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
      
        }
        #pragma unroll_loop_end
      
        #endif
      
        /*
        #if NUM_RECT_AREA_LIGHTS > 0
      
          // TODO (abelnation): update shadow for Area light
      
        #endif
        */
      
        #endif
      
        return shadow;
      
      }
      vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {

        // dir can be either a direction vector or a normal vector
        // upper-left 3x3 of matrix is assumed to be orthogonal
      
        return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
      
      }
      `,
      chunk: `
        #if NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SPOT_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0
          float shadow_float_${k} = getShadowMask(true);
        #else
          float shadow_float_${k} = 1.0;
        #endif
      `,
      out: `shadow_float_${k}`,
    };
  }
}
