'use strict'

import { expect } from 'chai'
import domSelector from '../src/main.js'

import Example1 from './vue-example-01.vue'


describe ( 'DOM Selector', () => {

beforeEach ( () => {
    
})

it ( 'Define simpliest selector', done => {
            cy.viewport ( 800, 650 )
            cy.mount ( Example1 )
            const d = document.querySelector('[data-cy-root]');
            const dom = domSelector();
            dom.define ({
                    name: 'ul',
                    selector: () => d.getElementsByTagName ( 'ul' )
                })
            cy.wait ( 0 )
              .then ( () => {
                            const r = dom.run ( 'ul' );
                            expect ( r.length ).to.equal ( 2 )
                            done ()
                })
    }) // it Define simpliest selector



it ( 'Scan deep', done => {
            cy.viewport ( 800, 650 )
            cy.mount ( Example1 )
            const d = document.querySelector('[data-cy-root]');
            const selector = domSelector();
            selector.define ({
                          name : 'component'
                        , selector: () => d
                })
            cy.wait ( 0 )
              .then ( () => {
                            const r = selector.run ( 'component' );
                            expect ( r.length ).to.equal ( 33 )
                            done ()
                })
    }) // it Scan deep



it ( 'Scan and filter', done => {
            cy.viewport ( 800, 650 )
            cy.mount ( Example1 )
            const d = document.querySelector('[data-cy-root]');
            const selector = domSelector();
            selector.define ({
                          name : 'component'
                        , selector: () => d
                        , where : ( item, i ) => {
                                                if ( item.tagName === 'SPAN' ) return true
                                                return false
                                        }
                })
            cy.wait ( 0 )
              .then ( () => {
                            const r = selector.run ( 'component' );
                            expect ( r.length ).to.equal ( 4 )
                            done ()
                })
    }) // it Scan and filter



it ( 'Stop the deep scan', done => {
            cy.viewport ( 800, 650 )
            cy.mount ( Example1 )
            const d = document.querySelector('[data-cy-root]');
            const selector = domSelector();
            selector.define ({
                          name : 'component'
                        , selector: () => d
                        , where : ( item, i ) => {
                                                if ( item.tagName === 'SPAN' ) return true
                                                return false
                                        }
                        , stop : ( item, result ) => {
                                                if ( result.length === 2 ) return true
                                                return false
                                        }
                })
            cy.wait ( 0 )
              .then ( () => {
                            const r = selector.run ( 'component' );
                            expect ( r.length ).to.equal ( 2 )
                            done ()
                })
    }) // it Stop the deep scan



it ( 'Stop the deep scan2', done => {
            cy.viewport ( 800, 650 )
            cy.mount ( Example1 )
            const d = document.querySelector('[data-cy-root]');
            const selector = domSelector();
            selector.define ({
                          name : 'component'
                        , selector: () => d
                        , where : ( item, i ) => {
                                                if ( item.tagName === 'SPAN' ) return true
                                                return false
                                        }
                        , stop : ( item ) => {
                                                if ( item.tagName === 'UL' ) return true
                                                return false
                                        }
                })
            cy.wait ( 0 )
              .then ( () => {
                            const r = selector.run ( 'component' );
                            expect ( r.length ).to.equal ( 2 )
                            done ()
                })
    }) // it Stop the deep scan2

}) // describe