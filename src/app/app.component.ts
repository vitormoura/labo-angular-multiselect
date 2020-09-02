import { Component } from '@angular/core';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { range } from 'rxjs';

export interface IOptionPermutation {
  id: string;
  description: string;
  choisiePar: string | null;
}

export interface IValueLigneTableauTelephones {
  id: string;
  description: string;
  permutation: string;
  choisiePar: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'labo-multiselect';

  PAS_DE_SELECTION = '';
  PAS_CHOISIE_VALUE = '';

  formGroup = {} as FormGroup;
  optionsDisponibles = [] as IOptionPermutation[];

  constructor(private fb: FormBuilder) {}

  get lignesTableauTelephones() {
    return (this.formGroup.controls.tableauTelephones as FormArray)
      .controls as FormGroup[];
  }

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

  recupererOptionsDispoPour(id: string): IOptionPermutation[] {
    const self = this.recupererOptionParValue(id);

    return [
      self,
      ...this.optionsDisponibles.filter(
        (o) =>
          o.id !== id &&
          (o.choisiePar === this.PAS_CHOISIE_VALUE || o.choisiePar === id)
      ),
    ];
  }

  traiterChangementPermutation(
    id: string,
    idPermutChoisi: string,
    selectionAuto: boolean
  ) {
    console.log(
      `changement ligne ${id} (${selectionAuto ? 'auto' : 'manual'})`,
      idPermutChoisi
    );

    const op = this.recupererOptionParValue(id);
    const ligne = this.recupererFormGroupTableauPar(id);
    const choisieAuparavantPar = op.choisiePar;

    if (choisieAuparavantPar) {
      const oo = this.recupererFormGroupTableauPar(choisieAuparavantPar);

      if (oo) {
        const uu = this.recupererOptionParValue(choisieAuparavantPar);
        uu.choisiePar = this.PAS_CHOISIE_VALUE;

        if (uu.choisiePar === id) {
          oo.controls.permutation.setValue(this.PAS_CHOISIE_VALUE);
        }
      }
    }

    if (idPermutChoisi === this.PAS_DE_SELECTION) {
      op.choisiePar = this.PAS_CHOISIE_VALUE;
    } else {
      // Option valide
      const optionSelectionee = this.recupererOptionParValue(idPermutChoisi);
      optionSelectionee.choisiePar = id;
    }

    //if (choisi) this.majLignesTableauSansPermutation(selectionAuto);

    console.table(this.optionsDisponibles);
  }

  majLignesTableauSansPermutation(selectionAuto: boolean) {
    /*
    if (!selectionAuto) {
      return;
    }

    const array = this.formGroup.controls.tableauTelephones as FormArray;
    const fgsSansPermutation = array.controls
      .map((c) => c as FormGroup)
      .filter((c) => c.controls.permutation.value === this.PAS_DE_SELECTION);

    if (fgsSansPermutation.length === 1) {
      const fg = fgsSansPermutation[0] as FormGroup;
      const id = fg.controls.id.value;
      const optionsDispo = this.recupererOptionsDispoPour(id);

      if (optionsDispo.length === 1) {
        this.traiterChangementPermutation(id, optionsDispo[0].id, true);
      }
    }
    */
  }

  desactiverOption(id: string, selectionAuto: boolean) {
    const op = this.recupererOptionParValue(id);
    const array = this.formGroup.controls.tableauTelephones as FormArray;

    if (!op) {
      return;
    }

    if (!selectionAuto) {
      op.choisiePar = this.PAS_CHOISIE_VALUE;

      const fg = array.controls.find(
        (c) => (c as FormGroup).controls.permutation.value === id
      ) as FormGroup;

      if (fg) {
        fg.controls.permutation.setValue(this.PAS_DE_SELECTION);
      }
    }
  }

  ajouterOptionPermutation(reg: IOptionPermutation) {
    this.optionsDisponibles.push(reg);
  }

  recupererOptionParValue(value: string) {
    return this.optionsDisponibles.find((o) => o.id === value);
  }

  recupererFormGroupTableauPar(id: string) {
    const array = this.formGroup.controls.tableauTelephones as FormArray;

    return array.controls.find(
      (c) => (c as FormGroup).controls.id.value === id
    ) as FormGroup;
  }

  majTableauTelephones(qttLignes: number) {
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
        const fg = this.creerNouveauFormGroupTelephone(n);
        const reg = fg.value as IValueLigneTableauTelephones;

        array.push(fg);

        this.ajouterOptionPermutation({
          id: reg.id,
          description: reg.description,
          choisiePar: this.PAS_CHOISIE_VALUE,
        });
      });
    } else {
      //Valeur negative, il faut enlèver les dernières lignes

      range(0, Math.abs(qttPourCreer)).forEach((n) => {
        const posDerniereLigne = array.length - 1;
        const fg = array.at(posDerniereLigne);

        // TODO: Appliquer qq logique avant supprimer la ligne

        array.removeAt(posDerniereLigne);
        this.supprimerOptionPermutation(posDerniereLigne);
      });
    }

    console.table(this.optionsDisponibles);
  }

  creerNouveauFormGroupTelephone(pos: number) {
    const id = `Téléphone ${pos + 1}`;

    const fb = this.fb.group({
      id: id,
      description: `Téléphone ${pos + 1}`,
      permutation: '',
      choisiePar: this.PAS_CHOISIE_VALUE,
    } as IValueLigneTableauTelephones);

    fb.controls.permutation.valueChanges.subscribe((idPermutChoisi) => {
      this.traiterChangementPermutation(id, idPermutChoisi, false);
    });

    return fb;
  }

  supprimerOptionPermutation(pos: number) {
    const op = this.optionsDisponibles[pos];

    this.optionsDisponibles.splice(pos, 1);
  }
}
