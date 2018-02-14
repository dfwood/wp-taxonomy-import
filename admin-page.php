<?php
/**
 * Admin settings page template for dfwood/wp-taxonomy-import package.
 * @author David Wood <david@davidwood.ninja>
 * @link https://davidwood.ninja/
 * @license GPL-3.0+
 * @package dfwood\WordPress
 */

use dfwood\WordPress\TaxonomyImport;

?>
<div class="wrap">
    <h2><?php esc_html_e( 'Taxonomy Term Import', 'dfwood-wp-taxonomy-import' ); ?></h2>

    <div class="taxonomy-import-form">

        <p>
            <label>
                <span>Select taxonomy to import to:</span>
                <select name="_taxonomy_import_to">
                    <option value="">Select taxonomy</option>
					<?php
					foreach ( TaxonomyImport::_taxonomyList() as $value => $atts ) {
						?>
                        <option value="<?php echo esc_attr( $value ); ?>">
							<?php echo esc_html( "{$atts['label']} ({$atts['postTypes']})" ); ?>
                        </option>
						<?php
					}
					?>
                </select>
            </label>
        </p>

        <p>
            <label>
                <span>REST API endpoint to import from:</span>
                <input type="url" name="_taxonomy_import_rest_url" />
            </label>
        </p>

        <p>
            <label>
                <input type="checkbox" name="_taxonomy_import_use_ajax" value="ajax" /> Use local admin AJAX to import
                vs. REST API.
            </label>
        </p>

        <p>
            <button type="button" class="button button-primary">Import!</button>
        </p>

    </div>

</div>
