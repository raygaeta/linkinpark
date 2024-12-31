uniform float u_blue;
uniform float u_green;
uniform float u_red;
varying vec3 vColor;
void main() {
    
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(uv - vec2(0.5));

    if(distanceToCenter > 0.5)
        discard;
    gl_FragColor = vec4(vec3(u_red, u_green, u_blue), vColor.x);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}