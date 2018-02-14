<?php
/**
 * Plugin Name: WP Taxonomy Import
 * Plugin URI: https://github.com/dfwood/wp-taxonomy-import
 * Description: A small WordPress plugin that allows easily importing taxonomy terms from a WordPress REST API endpoint.
 * Author: David Wood
 * Author URI: https://davidwood.ninja/
 * Version: 0.1
 * License: GPL-3.0+
 * License URI: http://www.gnu.org/licenses/gpl-3.0.html
 * Text Domain: wp-taxonomy-import
 */

namespace dfwood\WordPress;

if ( ! defined( 'ABSPATH' ) ) {
	die();
}

/**
 * Class TaxonomyImport
 * @author David Wood <david@davidwood.ninja>
 * @link https://davidwood.ninja/
 * @license GPL-3.0+
 * @package dfwood\WordPress
 */
class TaxonomyImport {

	const AJAX_ACTION = 'dfwood_wp_taxonomy_import';

	/**
	 * @var string Admin page menu slug.
	 */
	protected static $menuSlug = 'dfwood-wp-tax-import';

	/**
	 * Kicks off our functionality by added appropriate action hooks.
	 */
	public static function initialize() {
		if ( is_admin() ) {
			add_action( 'admin_menu', [ __CLASS__, '_registerAdminPage' ] );
			add_action( 'admin_enqueue_scripts', [ __CLASS__, '_adminEnqueueScripts' ] );
			add_action( 'wp_ajax_' . self::AJAX_ACTION, [ __CLASS__, '_adminAjax' ] );
		}
	}

	/**
	 * Registers admin page.
	 */
	public static function _registerAdminPage() {
		add_management_page(
			esc_html__( 'Taxonomy Term Import', 'dfwood-wp-taxonomy-import' ),
			esc_html__( 'Taxonomy Import', 'dfwood-wp-taxonomy-import' ),
			'manage_options',
			self::$menuSlug,
			[ __CLASS__, '_adminPage' ]
		);
	}

	/**
	 * Admin page content.
	 */
	public static function _adminPage() {
		include __DIR__ . '/admin-page.php';
	}

	/**
	 * Enqueue our admin page JS/CSS.
	 *
	 * @param string $hook
	 */
	public static function _adminEnqueueScripts( $hook ) {
		if ( $hook === 'tools_page_' . self::$menuSlug ) {
			$suffix = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '' : '.min';

			wp_enqueue_script( 'taxonomy-import', plugin_dir_url( __FILE__ ) . "/assets/js/wp-taxonomy-import{$suffix}.js", [], false, true );

			wp_localize_script( 'taxonomy-import', 'taxonomyImport', [
				'restApi'   => rest_url( '/wp/v2/' ),
				'restNonce' => wp_create_nonce( 'wp_rest' ),
				'ajaxNonce' => wp_create_nonce( get_current_user_id() . self::AJAX_ACTION ),
			] );
		}
	}

	public static function _taxonomyList() {
		$taxonomies = get_taxonomies( [
			'show_in_rest' => true,
		], 'objects' );
		$list = [];
		foreach ( $taxonomies as $taxonomy ) {
			/* @var \WP_Taxonomy $taxonomy */
			$list[ $taxonomy->name ] = [
				'label'     => $taxonomy->label,
				'postTypes' => implode( ', ', (array) $taxonomy->object_type ),
			];
		}

		return $list;
	}

	public static function _adminAjax() {
		$response = [
			'status' => 200,
			'terms'  => [],
		];
		if ( ! empty( $_POST['_nonce'] ) && wp_verify_nonce( filter_input( INPUT_POST, '_nonce', FILTER_SANITIZE_STRING ), get_current_user_id() . self::AJAX_ACTION ) ) {
			$taxonomy = filter_input( INPUT_POST, 'taxonomy', FILTER_SANITIZE_STRING );
			$terms = @json_decode( filter_input( INPUT_POST, 'terms' ), true );

			if ( $taxonomy && is_array( $terms ) && taxonomy_exists( $taxonomy ) ) {
				foreach ( $terms as $term ) {
					$args = [];
					if ( 0 < $term['parent'] ) {
						$args['parent'] = absint( $term['parent'] );
					}
					$result = wp_insert_term( sanitize_text_field( $term['name'] ), $taxonomy, $args );
					if ( is_wp_error( $result ) && $result->get_error_data( 'term_exists' ) ) {
						$response['terms'][ $term['id'] ] = $result->get_error_data( 'term_exists' );
					} elseif ( ! is_wp_error( $result ) ) {
						$response['terms'][ $term['id'] ] = $result['term_id'];
					}
				}
			} else {
				$response['status'] = '400';
				$response['message'] = 'Invalid request!';
			}
		}

		wp_send_json( $response );
	}

}

TaxonomyImport::initialize();
