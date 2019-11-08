import { Config } from "../config";
import { Environment } from "contentful-management";

export interface Context {
    configs: Config[];
    token: string;
    environment: string;
    env: Environment<string>;
}

