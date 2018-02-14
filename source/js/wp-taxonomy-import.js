import {ready} from 'no-jquery';
import {GET, POST} from 'rest-api-request';

ready(() => {

    const form = document.querySelector('.taxonomy-import-form');

    if (form) {
        const importToField = form.querySelector('[name="_taxonomy_import_to"]');
        const importFromField = form.querySelector('[name="_taxonomy_import_rest_url"]');
        const button = form.querySelector('button');

        button.addEventListener('click', () => {
            const taxonomyBase = importToField.value;
            const remoteRest = importFromField.value;
            const method = form.querySelector('input[name="_taxonomy_import_use_ajax"]').value === '' ? 'rest' : 'ajax';

            if (!taxonomyBase || !remoteRest) {
                alert('A required field was left empty!');
                return;
            }

            const termsByParent = [];
            const termParentMap = [];
            const url = new window.URL(remoteRest);
            url.searchParams.set('per_page', '100');

            let page = 1;
            let totalPages = 0;

            const simplifyTerms = (terms, parent) => {
                const simpleTerms = [];
                terms.forEach((term) => {
                    const data = {
                        id: term.id,
                        name: term.name,
                        slug: term.slug,
                        parent: 0,
                    };
                    if (0 < parent && termParentMap[parent]) {
                        data.parent = termParentMap[parent];
                    }
                    simpleTerms.push(data);
                });

                return simpleTerms;
            };

            const ajaxInsertTerms = (parent = 0) => {
                if (termsByParent[parent] && termsByParent[parent].length) {
                    POST(window.ajaxurl, {
                        _nonce: window.taxonomyImport.ajaxNonce,
                        action: 'dfwood_wp_taxonomy_import',
                        taxonomy: taxonomyBase,
                        terms: JSON.stringify(simplifyTerms(termsByParent[parent], parent)),
                    }, window.taxonomyImport.ajaxNonce)
                        .then((response) => {
                            response.json().then((json) => {
                                if (json.terms) {
                                    Object.keys(json.terms).map((k) => {
                                        const id = parseInt(k, 10);
                                        termParentMap[id] = json.terms[k];
                                        if (termsByParent[id] && termsByParent[id].length) {
                                            ajaxInsertTerms(id);
                                        }
                                    });
                                }
                            });
                        });
                }
            };

            /*const insertTerms = (parent = 0) => {
                termsByParent[parent].forEach((term) => {
                    const data = {
                        name: term.name,
                    };
                    if (0 !== parent && 0 < termParentMap[parent]) {
                        data.parent = termParentMap[parent];
                    }
                    POST(`${window.taxonomyImport.restApi}${taxonomyBase}`, data, window.taxonomyImport.restNonce)
                        .then((response) => {
                            response.json().then((json) => {
                                console.log(json);
                                if (json.code && json.code === 'term_exists') {
                                } else {
                                    termParentMap[term.id] = json.id;
                                    if (termsByParent[term.id] && termsByParent[term.id].length) {
                                        insertTerms(term.id);
                                    }
                                }
                            });
                        });
                });
            };*/

            const requestTerms = (pageNum) => {
                url.searchParams.set('page', `${pageNum}`);

                GET(url.toString())
                    .then((response) => {
                        response.json().then((json) => {
                            page++;
                            if (200 === response.status) {
                                totalPages = response.headers.get('X-WP-Totalpages');
                            }
                            if (Array.isArray(json)) {
                                console.log(json);
                                json.forEach((term) => {
                                    if (!termsByParent[term.parent]) {
                                        termsByParent[term.parent] = [];
                                    }
                                    termsByParent[term.parent].push(term);
                                });
                            }
                            if (totalPages >= page) {
                                requestTerms(page);
                            } else {
                                // TODO: Consider re-implementing REST API insertion?
                                // if ('ajax' === method) {
                                ajaxInsertTerms();
                                // } else {
                                //    insertTerms();
                                // }
                            }
                        });
                    });
            };

            requestTerms(page);
        });
    }

});
