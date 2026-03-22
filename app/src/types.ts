export interface Person {
  id: number;
  given_name: string;
  surname: string;
  prefix: string;
  suffix: string;
  nickname: string;
  sex: 'M' | 'F' | 'U';
  birth_year: number | null;
  death_year: number | null;
  birth_date: string;
  death_date: string;
  birth_place: string;
  death_place: string;
  is_living: number;
  notes: string;
}

export interface FamilyEvent {
  id: number;
  person_id: number | null;
  family_id: number | null;
  event_type: string;
  date_display: string;
  year: number | null;
  month: number | null;
  day: number | null;
  sort_order: number;
  place: string;
  details: string;
  notes: string;
  // Joined fields from timeline
  given_name?: string;
  surname?: string;
  is_living?: number;
}

export interface Family {
  id: number;
  partner1_id: number | null;
  partner2_id: number | null;
  marriage_date: string;
  marriage_year: number | null;
  marriage_place: string;
  // Joined
  p1_given?: string;
  p1_surname?: string;
  p1_birth?: number;
  p1_death?: number;
  p2_given?: string;
  p2_surname?: string;
  p2_birth?: number;
  p2_death?: number;
  children?: ChildPerson[];
}

export interface ChildPerson {
  id: number;
  given_name: string;
  surname: string;
  birth_year: number | null;
  death_year: number | null;
  sex: string;
  is_living: number;
  birth_order: number;
  relation_to_partner1: string;
  relation_to_partner2: string;
}

export interface ParentFamily {
  id: number;
  father_id: number | null;
  father_given: string;
  father_surname: string;
  father_birth: number | null;
  father_death: number | null;
  mother_id: number | null;
  mother_given: string;
  mother_surname: string;
  mother_birth: number | null;
  mother_death: number | null;
}

export interface Citation {
  id: number;
  source_id: number;
  source_name: string;
  detail: string;
  actual_text: string;
}

export interface PersonDetail {
  person: Person;
  events: FamilyEvent[];
  families: Family[];
  parents: ParentFamily[];
  siblings: ChildPerson[];
  citations: Citation[];
}

export interface SurnameCount {
  surname: string;
  count: number;
}

export interface DecadeCount {
  decade: number;
  count: number;
}

export interface Stats {
  people: number;
  families: number;
  events: number;
  places: number;
  sources: number;
  living: number;
  surnames: SurnameCount[];
  decades: DecadeCount[];
}
