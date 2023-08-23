import {Taxonomy} from "./CompanyConcept";
import {DOMParser} from "xmldom";

interface Identifiable {
    id: string
}

interface Context {
    entity: {
        identifier: string,
    }
    period: {
        start?: string,
        end?: string,
        instant?: string
    }
}

interface ContextNode extends Context, Identifiable {
}


interface FactBase {
    unit?: string,
    taxonomy: string,
    tag: string,
    decimals?: number
    value: number | string
}

interface FactNode extends FactBase, Identifiable {
    contextRef: string
}

interface Fact extends FactBase {
    context: Context
}

type Unit = {
    id: string,
    measure: string | {
        divide: {
            unitNumerator: string,
            unitDenominator: string
        }
    }
}

interface FilingInterface {
    getFact(fact: string): Fact | null;

    getFact(taxonomy: Taxonomy, tag: string): Fact | null;

    filterFacts(predicate: (fact: Fact) => boolean): Fact[];
}

export default class Filing implements FilingInterface {
    private readonly facts: Array<FactNode>
    private readonly contexts: Array<ContextNode>
    readonly units: Array<Unit>

    private constructor(root: Element) {
        let contextCount = 0;
        let factCount = 0;
        for (let i = 0; i < root.childNodes.length; i++) {
            const node = root.childNodes.item(i);
            if (node.nodeType !== 1) continue;
            if (node.nodeName === "context") contextCount++;
            if (node.nodeName === "unit") factCount++;
        }
        const facts: FactNode[] = Array<FactNode>(factCount);
        const contexts: ContextNode[] = Array<ContextNode>(contextCount);
        const units: Unit[] = [];
        let i = 0;
        for (; i < root.childNodes.length; i++) { // Skip to context nodes
            const node = root.childNodes.item(i);
            if (node.nodeType !== 1) continue;
            if (node.nodeName === "context") break;
        }

        for (; i < root.childNodes.length; i++) { // Get context nodes
            const node = root.childNodes.item(i);
            if (node.nodeType !== 1) continue;
            if (node.nodeName !== "context") break;
            const element = node as Element; // NodeType 1 is an Element
            const context = this.toContext(element);
            const id = element.getAttribute("id")
            if (id === null) throw new Error("Could not convert node " + element.textContent + " to context");
            if (context === null) throw new Error("Could not convert node with id: " + id + " to context");
            const index = parseInt(id.split("-")[1]) - 1;
            contexts[index] = {
                ...context,
                id
            }
        }

        for (; i < root.childNodes.length; i++) { // Get unit nodes
            const node = root.childNodes.item(i);
            if (node.nodeType !== 1) continue;
            if (node.nodeName !== "unit") break;
            const element = node as Element; // NodeType 1 is an Element
            const id = element.getAttribute("id")
            if (id === null) throw new Error("Could not convert node " + element.textContent + " to unit");
            const measure = element.getElementsByTagName("measure").item(0);
            const divide = element.getElementsByTagName("divide").item(0);
            if (measure === null && divide === null) throw new Error("Could not convert node " + element.textContent + " to unit");
            if (measure !== null) {
                if (measure.textContent === null)
                    throw new Error("Could not convert node " + element.textContent + " to unit");
                units.push({
                    id,
                    measure: measure.textContent
                })
            } else {
                const numerator = divide?.getElementsByTagName("unitNumerator").item(0);
                const denominator = divide?.getElementsByTagName("unitDenominator").item(0);
                if (!numerator || !denominator) throw new Error("Could not convert node " + element.textContent + " to unit");
                const numeratorText = numerator.textContent;
                const denominatorText = denominator.textContent;
                if (numeratorText === null || denominatorText === null)
                    throw new Error("Could not convert node " + element.textContent + " to unit");
                units.push({
                    id,
                    measure: {
                        divide: {
                            unitNumerator: numeratorText,
                            unitDenominator: denominatorText
                        }
                    }
                })
            }
        }

        for (; i < root.childNodes.length; i++) { // Get facts
            const node = root.childNodes.item(i);
            if (node.nodeType !== 1) continue;
            const element = node as Element; // NodeType 1 is an Element
            const [taxonomy, tag] = element.nodeName.split(":");
            const decimals = element.getAttribute("decimals");
            const unit = element.getAttribute("unitRef");
            const value = element.textContent;
            const id = element.getAttribute("id");
            const contextRef = element.getAttribute("contextRef");
            if (value === null || contextRef === null || id === null) continue;
            const index = parseInt(id.split("-")[1]) - 1;
            facts[index] = {
                tag,
                taxonomy,
                decimals: decimals ? parseInt(decimals) : undefined,
                unit: unit ?? undefined,
                value: Number.isNaN(parseInt(value)) ? value : parseInt(value),
                contextRef,
                id
            };
        }

        this.contexts = contexts;
        this.units = units;
        this.facts = facts;

    }


    /**
     * Takes in a context element and returns a Context object or null if the input cannot be converted to a Context
     * @param input
     * @private
     */
    private toContext(input: Element):
        Context | null {
        const period = input.getElementsByTagName("period").item(0);
        const entity = input.getElementsByTagName("entity").item(0);
        if (period === null || entity === null) return null;
        const identifierElement = entity.getElementsByTagName("identifier").item(0);
        if (identifierElement === null) return null;
        const identifier = identifierElement.textContent;
        if (identifier === null) return null;
        const start = period.getAttribute("startDate") ?? undefined;
        const end = period.getAttribute("endDate") ?? undefined;
        const instant = period.getAttribute("instant") ?? undefined;
        if (start === null && end === null && instant === null) return null;
        return {
            entity: {
                identifier
            },
            period: {
                start,
                end,
                instant
            }
        }
    }

    private getContextById(node: FactNode):
        ContextNode {
        const i = node.contextRef.split("-")[1];
        return this.contexts[parseInt(i)];
    }

    /**
     * Takes in a fact element and returns a Fact object by adding its context
     * @param node The fact element
     * @private
     */
    private addContext(node: FactNode): Fact {
        const context = this.getContextById(node);
        if (context === null)
            throw new Error("Could not convert context");
        return {
            ...node,
            context
        }
    }

    getFact(id: number): Fact | null;
    getFact(fact: string): Fact | null;
    getFact(taxonomy: Taxonomy, tag: string):
        Fact | null;
    getFact(taxonomyOrFactOrId: string | number, tag ?: string): Fact | null {
        if (typeof taxonomyOrFactOrId === "number") {
            if (taxonomyOrFactOrId < 1 || taxonomyOrFactOrId > this.facts.length + 1) return null;
            const fact = this.facts[taxonomyOrFactOrId - 1];
            if (fact === undefined) return null;
            return this.addContext(fact);
        }
        let factName = taxonomyOrFactOrId;
        if (tag !== undefined)
            factName = `${taxonomyOrFactOrId}:${tag}`;
        const equals = (name: string) => (x: FactNode) => `${x.taxonomy}:${x.tag}` === name;
        const fact = this.facts.find(equals(factName));
        if (fact !== undefined)
            return this.addContext(fact);
        return null; // Fact not found
    }

    filterFacts(predicate: (fact: Fact) => boolean):
        Fact[] {
        const out: Fact[] = [];
        for (const fact of this.facts) {
            const context = this.addContext(fact);
            if (predicate(context))
                out.push(context);
        }
        return out;
    }

    static fromDocument(document: string):
        Filing

    static fromDocument(root: HTMLElement):
        Filing

    static fromDocument(root: string | HTMLElement):
        Filing {
        if (typeof root === "string") {
            const parser = new DOMParser();
            root = parser.parseFromString(root, "text/xml").documentElement;
        }
        return new Filing(root);
    }
}