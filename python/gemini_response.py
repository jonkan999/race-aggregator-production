import google.generativeai as genai
from typing import Dict, Any, List, Tuple, Optional
import PIL.Image
from pathlib import Path
import json
import os

import sys
import os

# Add the parent directory to the system path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from python.base_ai_response import BaseAIResponse

class GeminiResponse(BaseAIResponse):
    def _initialize_client(self):
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.config['model'])

    def _get_config_filename(self) -> str:
        return 'gemini_config.yaml'

    def _get_credentials_filename(self) -> str:
        return 'googleai_credentials.yaml'

    def calculate_cost(self, input_tokens: int, output_tokens: int) -> float:
        if input_tokens <= 128_000:
            input_cost = (input_tokens / 1_000_000) * 0.075
            output_cost = (output_tokens / 1_000_000) * 0.30
        else:
            input_cost = (input_tokens / 1_000_000) * 0.15
            output_cost = (output_tokens / 1_000_000) * 0.60
        
        return input_cost + output_cost

    def convert_messages_to_prompt(self, messages: List[Dict[str, str]]) -> str:
        prompt = ""
        for message in messages:
            role = message['role']
            content = message['content']
            
            if role == 'system':
                prompt += f"System: {content}\n\n"
            elif role == 'user':
                prompt += f"User: {content}\n\n"
            elif role == 'assistant':
                prompt += f"Assistant: {content}\n\n"
                
        return prompt.strip()

    def get_response(self, messages: List[Dict[str, str]], max_output_tokens: int = None) -> Dict[str, Any]:
        if max_output_tokens is None:
            max_output_tokens = self.config.get('max_output_tokens', 1000)

        prompt = self.convert_messages_to_prompt(messages)
        
        # Count input tokens before generating content
        input_tokens = self.model.count_tokens(prompt).total_tokens
        
        response = self.model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_output_tokens,
                temperature=self.config.get('temperature', 0.7)
            )
        )

        # Get token counts from usage metadata
        usage = response.usage_metadata
        if usage:
            prompt_tokens = usage.prompt_token_count
            completion_tokens = usage.candidates_token_count
            total_tokens = usage.total_token_count
        else:
            # Fallback if metadata not available
            prompt_tokens = input_tokens
            completion_tokens = len(response.text.split())
            total_tokens = prompt_tokens + completion_tokens

        cost = self.calculate_cost(prompt_tokens, completion_tokens)

        return {
            'content': response.text,
            'input_tokens': prompt_tokens,
            'output_tokens': completion_tokens,
            'cost': cost
        }

    def get_vision_response(self, prompt: str, image: PIL.Image, max_output_tokens: int = None) -> Dict[str, Any]:
        if max_output_tokens is None:
            max_output_tokens = self.config.get('max_output_tokens', 1000)

        try:
            response = self.model.generate_content(
                contents=[prompt, image],
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_output_tokens,
                    temperature=self.config.get('temperature', 0.7)
                )
            )

            # Check if response was blocked by safety filters
            if not response.candidates or response.candidates[0].finish_reason == 'SAFETY':
                return {
                    'content': "Image assessment failed: Content filtered by safety system",
                    'input_tokens': 258,  # Standard image token count
                    'output_tokens': 0,
                    'cost': self.calculate_cost(258, 0),
                    'error': 'safety_filtered'
                }

            # Get token counts from usage metadata
            usage = response.usage_metadata
            if usage:
                prompt_tokens = usage.prompt_token_count
                completion_tokens = usage.candidates_token_count
                total_tokens = usage.total_token_count
            else:
                prompt_tokens = self.model.count_tokens([prompt, image]).total_tokens
                completion_tokens = len(response.text.split())
                total_tokens = prompt_tokens + completion_tokens

            return {
                'content': response.text,
                'input_tokens': prompt_tokens,
                'output_tokens': completion_tokens,
                'cost': self.calculate_cost(prompt_tokens, completion_tokens)
            }

        except Exception as e:
            # Handle other types of errors
            error_msg = str(e)
            if 'safety' in error_msg.lower() or 'harm' in error_msg.lower():
                return {
                    'content': "Image assessment failed: Content filtered by safety system",
                    'input_tokens': 258,
                    'output_tokens': 0,
                    'cost': self.calculate_cost(258, 0),
                    'error': 'safety_filtered'
                }
            raise  # Re-raise other types of errors

class SEOContentGenerator:
    def __init__(self, country_code: str, language: str):
        self.country_code = country_code
        self.language = language
        self.gemini = GeminiResponse()
        
    def get_cache_key(self, county=None, race_type=None, category=None, city=None):
        """Generate a unique cache key for the combination of filters."""
        filters = []
        if county:
            filters.append(f"county:{county}")
        if race_type:
            filters.append(f"race_type:{race_type}")
        if category:
            filters.append(f"category:{category}")
        if city:
            filters.append(f"city:{city}")
            
        return "-".join(filter for filter in filters if filter)
    
    def load_seo_cache(self):
        """Load the SEO content cache for the specified country."""
        cache_path = Path(f'data/countries/{self.country_code}/seo_content_cache.json')
        if cache_path.exists():
            with cache_path.open('r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def save_seo_cache(self, cache):
        """Save the SEO content cache for the specified country."""
        cache_path = Path(f'data/countries/{self.country_code}/seo_content_cache.json')
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        with cache_path.open('w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    
    def generate_basic_seo_content(self, county=None, race_type=None, category=None, city=None):
        """Fallback function for basic SEO content generation."""
        location = city or county
        
        parts = []
        if category:
            parts.append(f"{category} lopp")
        if race_type:
            parts.append(race_type.lower())
        if location:
            parts.append(f"i {location}")
        
        title = " ".join(parts).capitalize() if parts else "Alla lopp"
        
        para_parts = []
        if category and race_type and location:
            para_parts.append(f"Hitta {category.lower()} {race_type.lower()}lopp i {location}.")
        elif category and race_type:
            para_parts.append(f"Utforska {category.lower()} {race_type.lower()}lopp i hela Sverige.")
        elif category and location:
            para_parts.append(f"Upptäck {category.lower()} lopp i {location}.")
        elif race_type and location:
            para_parts.append(f"Se alla {race_type.lower()}lopp i {location}.")
        elif category:
            para_parts.append(f"Hitta {category.lower()} lopp över hela Sverige.")
        elif race_type:
            para_parts.append(f"Utforska {race_type.lower()}lopp i alla regioner.")
        elif location:
            para_parts.append(f"Se alla typer av lopp i {location}.")
        
        para_parts.append("Här hittar du datum, distanser och all information du behöver för att planera ditt nästa lopp.")
        
        return {
            'title': title,
            'meta_description': title,
            'h1': title,
            'paragraph': " ".join(para_parts)
        }
    
    def generate_seo_content(self, county=None, race_type=None, category=None, city=None, important_keywords=None, 
                           county_options=None, type_options=None, available_categories=None, 
                           county_label='Alla län', race_type_label='Alla loppstyper'):
        """Generate SEO-friendly content using Gemini AI with caching."""
        # Create context for the AI
        filters = []
        if category:
            filters.append(f"category: {category}")
        else:
            filters.append(f"category: {race_type_label} ({', '.join(available_categories)})")
            
        if race_type:
            filters.append(f"race type: {race_type}")
        else:
            filters.append(f"race type: {race_type_label} ({', '.join(type_options.values())})")
            
        if county:
            filters.append(f"location: {county}")
        else:
            filters.append(f"location: {county_label} ({', '.join(county_options.values())})")
        
        messages = [
            {
                'role': 'user',
                'content': f"""Create SEO content in {self.language} for a race listing page. Use the exact values provided - do not translate or modify them.

Filters (use exact values, these are already in {self.language}): {', '.join(filters)}
Keywords (use only if naturally relevant): {', '.join(important_keywords or [])}

Provide EXACTLY this format without any deviation or additional text:
- Title: [Your title here]
- Meta description: [Your meta description here]
- H1: [Your H1 here]
- Paragraph: [Your paragraph here]

Important:
- When a filter shows all options (starts with 'Alla'), mention that it includes all available options
- Use the exact terms provided in the filters
- Keep content specific, concise, and informative without being promotional"""
            }
        ]

        # Get AI response
        response = self.gemini.get_response(messages)
        content = response['content']

        print(content)
        
        # Parse the response
        try:
            title = content.split("Title: ")[1].split("\n")[0].strip()
            meta_desc = content.split("Meta description: ")[1].split("\n")[0].strip()
            h1 = content.split("H1: ")[1].split("\n")[0].strip()
            paragraph = content.split("Paragraph: ")[1].strip()

            result = {
                'title': title,
                'meta_description': meta_desc,
                'h1': h1,
                'paragraph': paragraph
            }
            
            # Save to cache
            cache_key = self.get_cache_key(county, race_type, category, city)
            cache = self.load_seo_cache()
            cache[cache_key] = result
            self.save_seo_cache(cache)
            
            return result
            
        except IndexError as e:
            print(f"Error parsing AI response: {e}")
            return self.generate_basic_seo_content(county, race_type, category, city)

if __name__ == "__main__":
    # Create an instance of GeminiResponse
    gemini = GeminiResponse()

    # Mock configuration for testing
    gemini.api_key = "your_api_key_here"  # Replace with your actual API key
    gemini.config = {
        'model': 'your_model_name_here',  # Replace with your actual model name
        'max_output_tokens': 1000,
        'temperature': 0.7
    }

    # Sample messages to test the get_response method
    messages = [
        {
            'role': 'system',
            'content': "You are a helpful assistant."
        },
        {
            'role': 'user',
            'content': "Can you provide a summary of the latest running events?"
        }
    ]

    # Get a response from the model
    try:
        response = gemini.get_response(messages)
        print("Response Content:", response['content'])
        print("Input Tokens:", response['input_tokens'])
        print("Output Tokens:", response['output_tokens'])
        print("Cost:", response['cost'])
    except Exception as e:
        print("An error occurred:", str(e))