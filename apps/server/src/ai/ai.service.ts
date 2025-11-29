import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);

    async generateDiagramDescription(viewData: any): Promise<string> {
        this.logger.log('Generating diagram description...');

        // In a real scenario, we would use the API key from env
        if (!process.env.OPENAI_API_KEY) {
            this.logger.warn('No OpenAI API Key found. Returning mock description.');
            return this.mockDescription(viewData);
        }

        try {
            const { text } = await generateText({
                model: openai('gpt-4-turbo'),
                system: 'You are an expert Enterprise Architect. Analyze the provided ArchiMate model (JSON) and describe the data flows, critical dependencies, and potential risks. Be concise and professional.',
                prompt: JSON.stringify(viewData),
            });
            return text;
        } catch (error) {
            this.logger.error('Failed to generate description', error);
            return this.mockDescription(viewData);
        }
    }

    async askCoach(question: string): Promise<string> {
        this.logger.log(`Coach asked: ${question}`);

        // RAG Placeholder
        // 1. Embed question
        // 2. Search in pgvector (not implemented yet)
        // 3. Generate answer

        if (!process.env.OPENAI_API_KEY) {
            return this.mockCoachAnswer(question);
        }

        try {
            const { text } = await generateText({
                model: openai('gpt-4-turbo'),
                system: 'You are an expert ArchiMate Coach. Answer the user\'s question about modeling, best practices, or the ArchiModeler tool.',
                prompt: question,
            });
            return text;
        } catch (error) {
            this.logger.error('Failed to ask coach', error);
            return this.mockCoachAnswer(question);
        }
    }

    private mockDescription(viewData: any): string {
        const elementCount = viewData.nodes?.length || 0;
        const relationCount = viewData.edges?.length || 0;
        return `[MOCK AI OUTPUT] This view contains ${elementCount} elements and ${relationCount} relationships. 
      
It appears to represent a layered architecture. 
- **Business Layer**: Several actors and processes are visible.
- **Application Layer**: Components are realizing services.
- **Risks**: There might be a lack of redundancy in the Application Service layer.
      
(Configure OPENAI_API_KEY to get real analysis)`;
    }

    private mockCoachAnswer(question: string): string {
        return `[MOCK COACH OUTPUT] That's a great question about "${question}". 
      
In ArchiMate, we typically handle this by separating concerns between layers. 
1. Define your Business Actors.
2. Map them to Business Processes.
3. Support them with Application Services.

(Configure OPENAI_API_KEY to get real answers)`;
    }
}
