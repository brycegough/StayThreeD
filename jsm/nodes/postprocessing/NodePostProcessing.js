import {
	LinearFilter,
	Mesh,
	OrthographicCamera,
	PlaneGeometry,
	RGBAFormat,
	Scene,
	Vector2,
	WebGLRenderTarget
} from '../../../../three.module.js';

import { NodeMaterial } from '../materials/NodeMaterial.js';
import { ScreenNode } from '../inputs/ScreenNode.js';

class NodePostProcessing {

	constructor( renderer, renderTarget ) {

		if ( renderTarget === undefined ) {

			const parameters = {
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				format: RGBAFormat
			};

			const size = renderer.getDrawingBufferSize( new Vector2() );
			renderTarget = new WebGLRenderTarget( size.width, size.height, parameters );

		}

		this.renderer = renderer;
		this.renderTarget = renderTarget;

		this.output = new ScreenNode();
		this.material = new NodeMaterial();

		this.camera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
		this.scene = new Scene();

		this.quad = new Mesh( new PlaneGeometry( 2, 2 ), this.material );
		this.quad.frustumCulled = false; // Avoid getting clipped
		this.scene.add( this.quad );

		this.needsUpdate = true;

	}

	render( scene, camera, frame ) {

		if ( this.needsUpdate ) {

			this.material.dispose();

			this.material.fragment.value = this.output;
			this.material.build();

			if ( this.material.uniforms.renderTexture ) {

				this.material.uniforms.renderTexture.value = this.renderTarget.texture;

			}

			this.needsUpdate = false;

		}

		frame.setRenderer( this.renderer )
			.setRenderTexture( this.renderTarget.texture );

		this.renderer.setRenderTarget( this.renderTarget );
		this.renderer.render( scene, camera );

		frame.updateNode( this.material );

		this.renderer.setRenderTarget( null );
		this.renderer.render( this.scene, this.camera );

	}

	setPixelRatio( value ) {

		this.renderer.setPixelRatio( value );

		const size = this.renderer.getSize( new Vector2() );

		this.setSize( size.width, size.height );

	}

	setSize( width, height ) {

		const pixelRatio = this.renderer.getPixelRatio();

		this.renderTarget.setSize( width * pixelRatio, height * pixelRatio );

		this.renderer.setSize( width, height );

	}

	copy( source ) {

		this.output = source.output;

		return this;

	}

	toJSON( meta ) {

		const isRootObject = ( meta === undefined || typeof meta === 'string' );

		if ( isRootObject ) {

			meta = {
				nodes: {}
			};

		}

		if ( meta && ! meta.post ) meta.post = {};

		if ( ! meta.post[ this.uuid ] ) {

			const data = {};

			data.uuid = this.uuid;
			data.type = 'NodePostProcessing';

			meta.post[ this.uuid ] = data;

			if ( this.name !== '' ) data.name = this.name;

			if ( JSON.stringify( this.userData ) !== '{}' ) data.userData = this.userData;

			data.output = this.output.toJSON( meta ).uuid;

		}

		meta.post = this.uuid;

		return meta;

	}

}

export { NodePostProcessing };