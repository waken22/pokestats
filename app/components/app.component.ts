import {Component, OnInit, NgZone} from 'angular2/core';
import {HTTP_PROVIDERS} from 'angular2/http';
import {NgClass} from 'angular2/common';

import {Pokemon} from '../classes/pokemon';

import {PokemonListService} from '../services/pokemon-list.service';
import {PokemonService} from '../services/pokemon.service';

import {PokemonListComponent} from '../components/pokemon-list.component';

import {FirstCapitalLetter} from '../pipes/first-capital-letter.pipe';
import {ColorTag} from '../pipes/color-tag.pipe';

// load bootstrap 4
import {Alert, Ng2BootstrapConfig, Ng2BootstrapTheme} from 'ng2-bootstrap/ng2-bootstrap';
Ng2BootstrapConfig.theme = Ng2BootstrapTheme.BS4;

@Component({
    selector: 'pokestats-app',
    directives: [
        Alert,
        NgClass,
        PokemonListComponent
    ],
    providers: [
        HTTP_PROVIDERS,
        PokemonListService,
        PokemonService
    ],
    pipes: [
        FirstCapitalLetter,
        ColorTag
    ],
    templateUrl: 'app/templates/app.html'
})

export class AppComponent implements OnInit {
    
    search: string = '';

    // validation errors
    natureError: boolean = false;

    // pokemon parameters
    level: number = 100;
    nature: string = '';
    iv: { [id: string]: number; } = { 'hp': 31, 'atk': 31, 'def': 31, 'satk': 31, 'sdef': 31, 'spd': 31 };
    ev: { [id: string]: number; } = { 'hp': 0,  'atk': 0,  'def': 0,  'satk': 0,  'sdef': 0,  'spd': 0  };

    // pure stats
    max_stat: number = 400;
    stats_table = {
        'hp':   'hp',
        'atk':  'attack',
        'def':  'defense',
        'satk': 'special-attack',
        'sdef': 'special-defense',
        'spd':  'speed'
    }

    // natures
    natures_table = {
        'hardy':   { 'buff': null,   'nerf': null   },
        'lonely':  { 'buff': 'atk',  'nerf': 'def'  },
        'brave':   { 'buff': 'atk',  'nerf': 'spd'  },
        'adamant': { 'buff': 'atk',  'nerf': 'satk' },
        'naughty': { 'buff': 'atk',  'nerf': 'sdef' },
        'docile':  { 'buff': null,   'nerf': null   },
        'bold':    { 'buff': 'def',  'nerf': 'atk'  },
        'relaxed': { 'buff': 'def',  'nerf': 'spd'  },
        'impish':  { 'buff': 'def',  'nerf': 'satk' },
        'lax':     { 'buff': 'def',  'nerf': 'sdef' },
        'serious': { 'buff': null,   'nerf': null   },
        'timid':   { 'buff': 'spd',  'nerf': 'atk'  },
        'hasty':   { 'buff': 'spd',  'nerf': 'def'  },
        'jolly':   { 'buff': 'spd',  'nerf': 'satk' },
        'naive':   { 'buff': 'spd',  'nerf': 'sdef' },
        'bashful': { 'buff': null,   'nerf': null   },
        'modest':  { 'buff': 'satk', 'nerf': 'atk'  },
        'mild':    { 'buff': 'satk', 'nerf': 'def'  },
        'quiet':   { 'buff': 'satk', 'nerf': 'spd'  },
        'rash':    { 'buff': 'satk', 'nerf': 'sdef' },
        'quirky':  { 'buff': null,   'nerf': null   },
        'calm':    { 'buff': 'sdef', 'nerf': 'atk'  },
        'gentle':  { 'buff': 'sdef', 'nerf': 'def'  },
        'sassy':   { 'buff': 'sdef', 'nerf': 'spd'  },
        'careful': { 'buff': 'sdef', 'nerf': 'satk' }
    }

    constructor(private _pokemonService: PokemonService, private _ngZone: NgZone) {

        // expose this component's methods so they're callable outside angular
        window.angularComponentRef = {component: this, zone: _ngZone};
    }

    ngOnDestroy() {
        window.angularComponent = null;
    }

    
    ngOnInit() { }

    getKeysOfStatsTable() : Array<string> {

        return Object.keys(this.stats_table);
    }

    getKeysOfNaturesTable() : Array<string> {

        return Object.keys(this.natures_table);
    }

    displayPokemon() {

        return this._pokemonService.displayPokemon();
    }

    getLeveledMaxStat() : number {

        var L = this.defaultIfInvalid(+this.level, 1, 100, 100);
        return this.max_stat * L / 100;
    }

    getBaseStat(key): number {

        if (this.displayPokemon().stats != undefined) {

            for (var i = Object.keys(this.displayPokemon().stats).length - 1; i >= 0; i--) {

                var real_keys = Object.keys(this.displayPokemon().stats);
                var real_stat = this.displayPokemon().stats[real_keys[i]];

                if (real_stat.stat.name == this.stats_table[key])
                    return real_stat.base_stat;

            }
        }
        return -1;
    }

    getCalculatedStat(key): number {

        var base_stat = this.getBaseStat(key);
        if (base_stat != -1) {

            // formula vars
            var B = base_stat;
            var I = this.defaultIfInvalid(+this.iv[key], 0, 31);
            var E = this.defaultIfInvalid(Math.floor(+this.ev[key] / 4), 0, 255);
            var L = this.defaultIfInvalid(+this.level, 1, 100, 100);
            var N = 1;

            // consider nature
            if (this.nature.toLowerCase() in this.natures_table) {

                var nature = this.natures_table[this.nature.toLowerCase()];

                // we're looking for non-neutral natures
                if (nature['buff'] !== null && nature['nerf'] !== null) {

                    if (nature['buff'] == key) { N = 1.1; } else
                    if (nature['nerf'] == key) { N = 0.9; }
                }

            }

            // apply formulas
            if (key == 'hp') {

                if (this.displayPokemon().name == 'shedinja') {

                    // shedinja special case
                    return 1;

                } else {

                    // hp formula
                    return Math.floor( (2 * B + I + E) * L / 100 + L + 10 );
                }

            } else {
                
                // common case formula
                return Math.floor( Math.floor( (2 * B + I + E) * L / 100 + 5 ) * N );
            }

        }
        return 0;
    }

    // this executes outside through jquery since the input event is missing in angular2
    validateNature() {

        if (this.nature.toLowerCase() in this.natures_table) {

            // match! capitalize input & remove validation error
            this.nature = new FirstCapitalLetter().transform(this.nature);
            this.natureError = false;

        } else {

            // validation: written nature not in the list
            this.natureError = true;
        }

    }

    isValidRange(value, min, max): boolean {

        // check if it is a number
        if (typeof +value === 'number' && (value % 1) === 0) {

            // check range
            if (value >= min && value <= max) {

                return true;
            }
        }

        return false;
    }

    defaultIfInvalid(value, min, max, def = 0): number {

        if (this.isValidRange(value, min, max)) { return value; }
        return def;

    }

}