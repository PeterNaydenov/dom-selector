'use strict'

import { expect } from 'chai'
import domSelector from '../src/main.js'
import VisualController from '@peter.naydenov/visual-controller-for-vue3'



import Example1 from './vue-example-01.vue'


const html = new VisualController ();


describe ( 'DOM Selector', () => {

afterEach ( () => {
        // html.destroy ('root')
  })

it ( 'Define simpliest selector', done => {
            cy.viewport ( 800, 650 )
            const d = document.querySelector('[data-cy-root]') || document.createElement ( 'div' );
            d.id = 'root'

            html.publish ( Example1, {}, 'root' )
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
            const d = document.querySelector('[data-cy-root]');
            d.id = 'root'
            html.publish ( Example1, {}, 'root' )

            const dom = domSelector();
            dom.define ({
                          name : 'component'
                        , selector: () => d
                })

            cy.wait ( 0 )
              .then ( () => {
                            const r = dom.run ( 'component' );
                            expect ( r.length ).to.equal ( 31 )
                            done ()
                })
    }) // it Scan deep



it ( 'Scan and filter', done => {
            cy.viewport ( 800, 650 )
            const d = document.querySelector('[data-cy-root]');
            d.id = 'root'
            html.publish ( Example1, {}, 'root' )

            const dom = domSelector();
            dom.define ({
                          name : 'component'
                        , selector: () => d
                        , where : ({item, i}) => {
                                                if ( item.tagName === 'SPAN' ) return true
                                                return false
                                        }
                })
            cy.wait ( 0 )
              .then ( () => {
                            const r = dom.run ( 'component' );
                            expect ( r.length ).to.equal ( 4 )
                            done ()
                })
    }) // it Scan and filter



it ( 'Stop the deep scan', done => {
            cy.viewport ( 800, 650 )
            const 
                  d = document.querySelector ('[data-cy-root]')
                , dom = domSelector ()
                ;
            d.id = 'root'
            html.publish ( Example1, {}, 'root' )

            dom.define ({
                          name : 'component'
                        , selector: () => d
                        , where : ({item, i, END, length }) => {
                                                if ( item.tagName !== 'SPAN' )  return null      // Continue only if SPAN element
                                                return ( length < 2 ) ? item : END        // Stop when we found 2 SPAN elements
                                        }
                })
            cy.wait ( 0 )
              .then ( () => {
                            const r = dom.run ( 'component' );
                            expect ( r.length ).to.equal ( 2 )
                            done ()
                })
    }) // it Stop the deep scan



it ( 'Stop the deep scan2', done => {
            cy.viewport ( 800, 650 )
            
            const 
                  d = document.querySelector('[data-cy-root]')
                , dom = domSelector()
                ;
            d.id = 'root'
            html.publish ( Example1, {}, 'root' )

            dom.define ({
                          name : 'component'
                        , selector: () => d
                        , where : ({item, i, END, length }, counter ) => {
                                    // item   -> selector element
                                    // i      -> index of the selector element
                                    // length -> length of the result array
                                    // END    -> Symbol to stop the scan
                                                if ( counter.value >= 2      ) return END     // Stop when we found 2 SPAN elements
                                                if ( item.tagName !== 'SPAN' ) return null    // Continue only if SPAN element
                                                counter.value++                               // Increment the SPAN counter
                                                return item                                   // Return the element
                                        }
                })
            cy.wait ( 0 )
              .then ( () => {
                            let counter = {value:0}; // Counter must be an object to be passed by reference
                            const r = dom.run ( 'component', counter );
                            expect ( r.length ).to.equal ( 2 )
                            done ()
                })
    }) // it Stop the deep scan2



it ( 'Back scan to the body', done => { 
            cy.viewport ( 800, 650 )
            
            const 
                  d = document.querySelector('[data-cy-root]')
                , dom = domSelector ()
                ;
            d.id = 'root'
            html.publish ( Example1, {}, 'root' )

            dom.define ({
                          name : 'component'
                        , selector: () => d
                        , direction : 'up'
                })
                
            cy.wait ( 0 )
              .then ( () => {
                            const r = dom.run ( 'component' );
                            expect ( r.length ).to.equal ( 2 )
                            done ()
                })
    }) // it Back scan to the body



it ( 'Selector index', done => {
        cy.viewport ( 800, 650 )
        
        const 
              d = document.querySelector('[data-cy-root]')
            , dom = domSelector()
            , tagCounter = new Set()
            ;

        d.id = 'root'
        html.publish ( Example1, {}, 'root' )

        cy.wait ( 0 )
          .then ( () => { 
                          dom.define ({
                                      name: 'list'
                                    , selector: () => d
                                    , where : ({item, i, END }, tagCounter ) => {
                                                              tagCounter.add ( i )
                                                              return ( i < 9 ) ? item : END
                                                          }
                                })
                          dom.run ( 'list', tagCounter );
                          expect ( tagCounter.size ).to.equal ( 10 ) // 10 elements ( 9 + index 0 )
                          expect ( tagCounter.has ( 0 ) ).to.equal ( true )
                          expect ( tagCounter.has ( 9 ) ).to.equal ( true )
                          done ()
              })
}) // it Selector index



it ( 'Find span elements inside a list', done => {
        cy.viewport ( 800, 650 )
        
        const 
              d = document.querySelector('[data-cy-root]')
            , dom = domSelector()
            ;

        d.id = 'root'
        html.publish ( Example1, {}, 'root' )

        cy.wait ( 0 )
          .then ( () => {
                dom.define ({ 
                            name: 'ul-span'
                          , selector: () => d.querySelectorAll ( 'span' )
                          , where: ({item, i, END, length, down, up}) => {
                                        let liSpan = false
                                        for ( let parent of up(item) ) {
                                                   if ( parent.tagName === 'LI' )   liSpan = true
                                            }
                                        return ( liSpan ) ? item : null
                                    }
                      })
                const r = dom.run ( 'ul-span' )
                expect ( r.length ).to.equal ( 2 )
                done ()
            })
}) // it Find span elements inside a list



it ( 'Find only li that have span', done => {
        cy.viewport ( 800, 650 )
        const 
              d = document.querySelector('[data-cy-root]')
            , dom = domSelector()
            ;
          
        d.id = 'root'
        html.publish ( Example1, {}, 'root' )

        cy.wait ( 0 )
          .then ( () => {
                dom.define ({ 
                            name: 'li-span'
                          , selector: () => d.querySelectorAll ( 'li' )
                          , where: ({item, i, END, length, down, up}) => {
                                        let liSpan = false
                                        for ( let child of down(item) ) {
                                                   if ( child.tagName === 'SPAN' )   liSpan = true
                                            }
                                        return ( liSpan ) ? item : null
                                    }
                      })
                const r = dom.run ( 'li-span' )
                expect ( r.length ).to.equal ( 2 )
                done ()
            })
}) // it Find span elements inside a list



it ( 'Arguments for method "Run" available as arguments for the selector function', done => {
        cy.viewport ( 800, 650 )
        const 
              d = document.querySelector('[data-cy-root]')
            , dom = domSelector ()
            ;
          
        d.id = 'root'
        html.publish ( Example1, {}, 'root' )

        cy.wait ( 0 )
          .then ( () => {
                dom.define ({ 
                            name: 'li-span'
                          , selector: ( selector ) => d.querySelectorAll ( selector )
                      })
                const r = dom.run ( 'li-span', 'li' )
                expect ( r.length ).to.equal ( 9 )
                done ()
            })

}) // it Arguments for method "Run" available as arguments for the selector function



it ( 'Parameterized selector with filter', done => {
        cy.viewport ( 800, 650 )
        const 
              d = document.querySelector('[data-cy-root]')
            , dom = domSelector ()
            ;
          
        d.id = 'root'
        html.publish ( Example1, {}, 'root' )

        cy.wait ( 0 )
          .then ( () => {
                    dom.define ({   // Define a parameterized selector. Result should be filtered (only elements that contains SPAN )
                              name: 'li-span'
                            , selector: ( target ) => document.querySelectorAll ( target )
                            , where: ({item, i, END, length, down, up }) => {
                                          let res =[];
                                          for ( let child of down(item) ) {
                                                    if ( child.tagName === 'SPAN' )   res.push ( child.parentElement )
                                                  }
                                          return ( res.length > 0 ) ? res : null
                                } // where
                        })
                    const r = dom.run ( 'li-span', '.nav' )
                    expect ( r.length ).to.equal ( 1 )
                    done ()
              })
}) // it Parameterized selector with filter



}) // describe


