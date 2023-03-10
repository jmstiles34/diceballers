export interface DiceRoll {
    id: number;
    autoFirstDown?: boolean | false,
    description: string[],
    isPenalty?: boolean | false,
    isTurnover?: boolean | false,
    yards: number | number[],
};

interface Colors {
    primary: string,
    secondary: string,
    faceMask?: string;
    helmet?: string;
    stripe?: string;
    trim?: string;
}

export interface Team {
    id: string,
    city: string,
    cityKey: string,
    colors: Colors;
    isCustom?: boolean;
    logo?: string;
    logoFixed?: boolean;
    logoWidth?: number;
    logoPosition?: number[];
    name: string,
}

export interface Logo {
    name: string,
    file: string,
}

export type Modal = (value: string) => void;

export type SaveTeam = (a: Team) => void;

export type Void = () => void;