import { Compiler } from '../compiler';
import { FloatNode, Sampler2DNode, Vec2Node, Vec4Node } from '../types';


export class GetShadowNode extends FloatNode {
  constructor(
    private shadowMap: Sampler2DNode,
    private shadowMapSize: Vec2Node,
    private shadowBias: FloatNode,
    private shadowRadius: FloatNode,
    private shadowCoord: Vec4Node
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

      vec2 unpackRGBATo2Half( vec4 v ) {
        return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
      }

      vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {

        return unpackRGBATo2Half( texture2D( shadow, uv ) );

      }

      float VSMShadow (sampler2D shadow, vec2 uv, float compare ){

        float occlusion = 1.0;

        vec2 distribution = texture2DDistribution( shadow, uv );

        float hard_shadow = step( compare , distribution.x ); // Hard Shadow

        if (hard_shadow != 1.0 ) {

          float distance = compare - distribution.x ;
          float variance = max( 0.00000, distribution.y * distribution.y );
          float softness_probability = variance / (variance + distance * distance ); // Chebeyshevs inequality
          softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 ); // 0.3 reduces light bleed
          occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );

        }
        return occlusion;

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
      `,
      out: `getShadow(${c.get(this.shadowMap)}, ${c.get(this.shadowMapSize)}, ${c.get(this.shadowBias)}, ${c.get(this.shadowRadius)}, ${c.get(this.shadowCoord)})`
    }
  }

}