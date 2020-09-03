import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  FormArray,
  ControlContainer,
} from '@angular/forms';
import { range } from 'rxjs';
import { TypeofExpr } from '@angular/compiler';

export interface IValueLigneTableauTelephones {
  id: string;
  description: string;
  permutation: string;
  permutationTemp: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'labo-multiselect';

  PAS_DE_SELECTION = '';

  formGroup = {} as FormGroup;
  optionsDisponibles = [] as string[];
  refTimeoutMaj = undefined as number;

  get lignesTableauTelephones(): FormGroup[] {
    return (this.formGroup.controls.tableauTelephones as FormArray)
      .controls as FormGroup[];
  }

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      qttTelephones: 0,
      tableauTelephones: this.fb.array([]),
    });

    this.formGroup.controls.qttTelephones.valueChanges.subscribe((v) => {
      this.majTableauTelephones(parseInt(v, 10) || 0);
    });

    this.formGroup.controls.qttTelephones.setValue(5);
  }

  recupererOptionsDispoPour(ligne: IValueLigneTableauTelephones): string[] {
    const opts = [...this.optionsDisponibles];

    // L'option deja selecionée par la ligne doit s'afficher aussi
    // (elle n'est plus presente dans la liste d'options disponibles)
    if (ligne.permutation) {
      opts.unshift(ligne.permutation);
    }

    // Si l'option "Pas de permu" est dispo, il faut l'afficher en premier
    const posLigne = opts.indexOf(ligne.id);

    if (posLigne >= 0) {
      const opt = opts[posLigne];
      opts.splice(posLigne, 1);
      opts.unshift(opt);
    }

    return opts;
  }

  majEtatPermutationsTableau(): void {
    const lignes = this.formGroup.controls.tableauTelephones
      .value as IValueLigneTableauTelephones[];

    const etatDesire = {
      lignesParId: lignes.reduce(
        (p, c) => Object.assign(p, { [c.id]: Object.assign({}, c) }),
        {}
      ) as { [key: string]: IValueLigneTableauTelephones },
      optionsDisponibles: [...this.optionsDisponibles],
    };

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Le bonheur ^_^

    const zeroVersOption = (id: string, permu: string) => {
      const pos = etatDesire.optionsDisponibles.indexOf(permu);

      if (pos >= 0) {
        console.log(`zero>option (${id} -> ${permu})`);

        etatDesire.optionsDisponibles.splice(pos, 1);

        etatDesire.lignesParId[id].permutation = permu;
        etatDesire.lignesParId[id].permutationTemp = permu;

        verifierAutoSelection();
      }
    };

    const optionVersZero = (id: string, permuCourante: string) => {
      console.log(`option>zero (${id} -> de ${permuCourante} vers zero)`);
      etatDesire.optionsDisponibles.push(permuCourante);
      etatDesire.lignesParId[id].permutation = this.PAS_DE_SELECTION;
    };

    const optionVersOption = (
      id: string,
      permuCourante: string,
      nouvellePermu: string
    ) => {
      console.log(
        `option>option (${id} -> de ${permuCourante} vers ${nouvellePermu})`
      );
      optionVersZero(id, permuCourante);
      zeroVersOption(id, nouvellePermu);
    };

    const verifierAutoSelection = () => {
      // Un seule option disponible?
      if (etatDesire.optionsDisponibles.length === 1) {
        const optionSansPermu = Object.keys(etatDesire.lignesParId).find(
          (k) => etatDesire.lignesParId[k].permutation === this.PAS_DE_SELECTION
        );

        console.log(
          `selection auto ${optionSansPermu} -> ${etatDesire.optionsDisponibles[0]}`
        );

        zeroVersOption(optionSansPermu, etatDesire.optionsDisponibles[0]);
      }
    };

    lignes.forEach((c) => {
      const permuAnterieur = c.permutation;
      const permuCourante = c.permutationTemp;

      if (permuAnterieur === permuCourante) {
        return;
      }

      if (
        permuAnterieur === this.PAS_DE_SELECTION &&
        permuCourante !== this.PAS_DE_SELECTION
      ) {
        zeroVersOption(c.id, permuCourante);
      } else if (
        permuAnterieur !== this.PAS_DE_SELECTION &&
        permuCourante === this.PAS_DE_SELECTION
      ) {
        optionVersZero(c.id, permuAnterieur);
      } else {
        optionVersOption(c.id, permuAnterieur, permuCourante);
      }
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Maj l'état des lignes du tableau
    this.lignesTableauTelephones.forEach((fg) => {
      const etatDesireLigne = etatDesire.lignesParId[fg.controls.id.value];

      fg.controls.permutation.setValue(etatDesireLigne.permutation);
      fg.controls.permutationTemp.setValue(etatDesireLigne.permutationTemp, {
        emitEvent: false, //il faut éviter cet événement , sinon on va tomber dans une boucle infinie
      });
    });

    // Maj les options disponibles
    this.optionsDisponibles = etatDesire.optionsDisponibles;

    console.log('options disponibles', this.optionsDisponibles);
    console.table(this.formGroup.controls.tableauTelephones.value);
  }

  ////////////////////////////////////////

  majTableauTelephones(qttLignes: number): void {
    const array = this.formGroup.controls.tableauTelephones as FormArray;
    const qttPourCreer = qttLignes - array.controls.length;

    if (qttPourCreer === 0) {
      // Aucune valeur, on vide le tableau

      while (array.controls.length > 0) {
        array.removeAt(0);
      }

      this.optionsDisponibles = [];
    } else if (qttPourCreer > 0) {
      // Valeur positive, il faut ajouter des lignes

      range(array.length, qttPourCreer).forEach((n) => {
        const id = `Téléphone ${n + 1}`;
        const fg = this.creerNouveauFormGroupTelephone(id, id);

        //Liste globale d'options
        this.optionsDisponibles.push(fg.controls.id.value);

        array.push(fg);
      });

      //TODO: il faut choisir automatiquement des options pour des lignes ajoutées ?
      //...
    } else {
      // Valeur negative, il faut enlèver les dernières lignes

      range(0, Math.abs(qttPourCreer)).forEach((n) => {
        const posDerniereLigne = array.length - 1;
        const fg = array.at(posDerniereLigne) as FormGroup;

        this.supprimerOptionPermutation(fg);

        array.removeAt(posDerniereLigne);
      });
    }
  }

  creerNouveauFormGroupTelephone(id: string, description: string): FormGroup {
    const fb = this.fb.group({
      id,
      description,
      permutation: this.PAS_DE_SELECTION,
      permutationTemp: this.PAS_DE_SELECTION,
    } as IValueLigneTableauTelephones);

    fb.controls.permutationTemp.valueChanges.subscribe((idPermutChoisi) => {
      if (this.refTimeoutMaj) {
        clearTimeout(this.refTimeoutMaj);
      }

      //Il faut reporter l'execution pour nous assurer que il y aura seulement une maj d'état par fois
      this.refTimeoutMaj = setTimeout(() => {
        this.majEtatPermutationsTableau();
      }, 0);
    });

    return fb;
  }

  supprimerOptionPermutation(ligne: FormGroup): void {
    const id = ligne.controls.id.value;

    //Enlève l'option courante selectionnée par la ligne
    ligne.controls.permutationTemp.setValue(this.PAS_DE_SELECTION, {
      emitEvent: false,
    });
    this.majEtatPermutationsTableau();

    //Et si l'option est selectionné par qqn, reinitialise son état aussi
    this.lignesTableauTelephones
      .filter((fg) => fg.controls.permutation.value === id)
      .forEach((fg) => {
        fg.controls.permutationTemp.setValue(this.PAS_DE_SELECTION, {
          emitEvent: false,
        });
        this.majEtatPermutationsTableau();
      });

    this.optionsDisponibles = this.optionsDisponibles.filter((x) => x !== id);
  }
}
