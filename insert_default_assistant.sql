-- Insert a default assistant
INSERT INTO public.assistants (
    name,
    description,
    model,
    temperature,
    max_tokens,
    system_prompt
) VALUES (
    'Default Assistant',
    'A general-purpose AI assistant for handling various tasks',
    'gpt-4',
    0.7,
    2000,
    'You are a helpful AI assistant that provides clear and concise responses.'
) RETURNING id; 