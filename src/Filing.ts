import {isTaxonomy, Taxonomy} from "./CompanyConcept";

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
    unit: string,
    taxonomy: Taxonomy,
    tag: string,
    decimals: number
    value: number | string
}

interface FactNode extends FactBase, Identifiable {
    contextRef: string
}

interface Fact extends FactBase {
    context: Context
}

interface FilingInterface {
    getFact(fact: string): Fact | null;

    getFact(taxonomy: Taxonomy, tag: string): Fact | null;

    filterFacts(predicate: (fact: Fact) => boolean): Fact[];
}

export default class Filing implements FilingInterface {
    private readonly root: HTMLElement
    private readonly facts: Array<FactNode>
    private readonly contexts: Array<ContextNode>

    private constructor(root: HTMLElement) {
        this.root = root;
        this.facts = this.getFacts(root);
        this.contexts = this.getContexts(root);
    }


    /**
     * Takes in a context element and returns a Context object or null if the input cannot be converted to a Context
     * @param input
     * @private
     */
    private toContext(input: Element): Context | null {
        const period = input.getElementsByTagName("period").item(0);
        const entity = input.getElementsByTagName("entity").item(0);
        if (period === null || entity === null) return null;
        const identifierNode = entity.getElementsByTagName("identifier").item(0);
        if (identifierNode === null) return null;
        const identifier = identifierNode.textContent;
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

    private getContextById(node: FactNode): ContextNode {
        const i = node.contextRef.split("-")[1];
        return this.contexts[parseInt(i)];
    }

    /**
     * Takes in a fact element and returns a Fact object by adding its context
     * @param node The fact element
     * @private
     */
    private getContext(node: FactNode): Fact {
        const context = this.getContextById(node);
        if (context === null)
            throw new Error("Could not convert context");
        return {
            ...node,
            context
        }
    }

    getFact(fact: string): Fact | null;
    getFact(taxonomy: Taxonomy, tag: string): Fact | null;
    getFact(taxonomyOrFact: string, tag?: string): Fact | null {
        let factName = taxonomyOrFact;
        if (tag !== undefined)
            factName = `${taxonomyOrFact}:${tag}`;
        for (const fact of this.facts) {
            if (fact.tag === factName)
                return this.getContext(fact);
        }
        return null; // Fact not found
    }

    filterFacts(predicate: (fact: Fact) => boolean): Fact[] {
        const out: Fact[] = [];
        for (const fact of this.facts) {
            const context = this.getContext(fact);
            if (predicate(context))
                out.push(context);
        }
        return out;
    }

    static fromDocument(root: HTMLElement): Filing {
        return new Filing(root);
    }

    private getFacts(root: HTMLElement): FactNode[] {
        const facts: FactNode[] = [];
        let i = 0;
        while (root.children.item(i)?.nodeName === "context") {
            i++;
        }
        for (; i < root.children.length; i++) {
            const node = root.children.item(i);
            if (node === null || node.nodeName === "context") continue;
            const [tag, taxonomy] = node.nodeName.split(":");
            const decimals = node.getAttribute("decimals");
            const unit = node.getAttribute("unitRef");
            const value = node.textContent;
            const id = node.getAttribute("id");
            const contextRef = node.getAttribute("contextRef");
            if (value === null || unit === null || decimals === null || contextRef === null
                || id === null || !isTaxonomy(taxonomy)) continue;
            facts.push({
                tag,
                taxonomy,
                decimals: parseInt(decimals),
                unit,
                value,
                contextRef,
                id
            });
        }
        return facts;
    }

    private getContexts(root: HTMLElement): ContextNode[] {
        const contexts: ContextNode[] = [];
        for (let i = 0; i < root.children.length; i++) {
            const node = root.children.item(i);
            if (node === null || node.nodeName !== "context") continue;
        }
        return contexts;
    }

}