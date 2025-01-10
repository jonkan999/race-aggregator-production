import google.generativeai as genai
from typing import Dict, Any, List, Tuple, Optional
import PIL.Image
from python.base_ai_response import BaseAIResponse
from pathlib import Path
import json

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
    def __init__(self, country_code: str, language: str, free_tier: bool = True):
        self.country_code = country_code
        self.language = language
        self.gemini = GeminiResponse()
        self.gemini.is_free_tier = free_tier  # Set the free_tier status
        
        if free_tier:
            print("""
╔════════════════════════════════════════════════════════════════╗
║                     RATE LIMITING ENABLED                       ║
║ Waiting 4 seconds between requests due to Gemini free tier     ║
║ limitation (15 requests/minute). Remove this delay when using  ║
║ a paid account for faster generation.                          ║
╚════════════════════════════════════════════════════════════════╝
            """)
    
    def get_cache_key(self, county=None, race_type=None, category=None):
        """Generate a unique cache key for the combination of filters."""
        filters = []
        if county:
            filters.append(f"county:{county}")
        if race_type:
            filters.append(f"race_type:{race_type}")
        if category:
            filters.append(f"category:{category}")
            
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
    
    def generate_basic_seo_content(self,index_content, county=None, race_type=None, category=None):
        """Fallback function for basic SEO content generation."""
        location = county #city or county
        
        # Get templates from config
        templates = index_content['seo_templates']
        title_parts = templates['title_parts']
        para_templates = templates['paragraph_templates']
        
        # Build title
        parts = []
        if category:
            parts.append(title_parts['category'].format(category=category))
        if race_type:
            parts.append(title_parts['race_type'].format(race_type=race_type.lower()))
        if location:
            parts.append(title_parts['location'].format(location=location))
        
        title = " ".join(parts).capitalize() if parts else title_parts['default']
        
        # Build paragraph
        para_parts = []
        if category and race_type and location:
            para_parts.append(para_templates['category_race_location'].format(
                category=category.lower(),
                race_type=race_type.lower(),
                location=location
            ))
        elif category and race_type:
            para_parts.append(para_templates['category_race'].format(
                category=category.lower(),
                race_type=race_type.lower()
            ))
        elif category and location:
            para_parts.append(para_templates['category_location'].format(
                category=category.lower(),
                location=location
            ))
        elif race_type and location:
            para_parts.append(para_templates['race_location'].format(
                race_type=race_type.lower(),
                location=location
            ))
        elif category:
            para_parts.append(para_templates['category_only'].format(
                category=category.lower()
            ))
        elif race_type:
            para_parts.append(para_templates['race_only'].format(
                race_type=race_type.lower()
            ))
        elif location:
            para_parts.append(para_templates['location_only'].format(
                location=location
            ))
        
        para_parts.append(para_templates['default_suffix'])
        
        return {
            'title': title,
            'meta_description': title,
            'h1': title,
            'paragraph': " ".join(para_parts)
        }
    
    def generate_seo_content(self, index_content, county=None, race_type=None, category=None, 
                           important_keywords=None, county_options=None, type_options=None, 
                           available_categories=None):
        """Generate SEO-friendly content using Gemini AI with caching."""
        # Check cache first
        cache_key = self.get_cache_key(county, race_type, category)
        cache = self.load_seo_cache()
        
        if cache_key in cache:
            print(f"Using cached content for: {cache_key}")
            return cache[cache_key]
            
        # If not in cache, proceed with AI generation
        print(f"Generating new content for: {cache_key}")
        
        active_filters = []
        filters = []
        if category:
            filters.append(f"category: {category}")
            active_filters.append(category)
        else:
            filters.append(f"category (not yet specified): {index_content['filter_categories']} ({', '.join(available_categories)})")
            
        if race_type:
            filters.append(f"race type: {race_type}")
            active_filters.append(race_type)
        else:
            filters.append(f"race type (not yet specified): {index_content['filter_race_type']} ({', '.join(type_options.values())})")
            
        if county:
            filters.append(f"location: {county}")
            active_filters.append(county)
        else:
            filters.append(f"location (not yet specified): {index_content['filter_county']} [{', '.join(county_options.values())}])")
        
        messages = [
            {
                'role': 'user',
                'content': f"""Create SEO content in {self.language} for a race listing page.

These are the filters and available options: {', '.join(filters)}. For the (not yet specified) filters, use the label text, first value, along with the option texts, provided in the brackets, in a naturally flowing way but don't list all options.
Keywords (use only if naturally relevant to the context and use the exact terms provided): {', '.join(important_keywords or [])}

Return EXACTLY in this format (include the dash and space at the start of each line):
- Title: [Your title here]
- Meta description: [Your meta description here]
- H1: [Your H1 here]
- Paragraph: [Your paragraph here]

Rules:
- In the title and h1, make sure to include the active filters: {', '.join(active_filters)}. In a natural way.
- Keep the exact filter texts as provided, DO NOT translate or vary them: {', '.join(filters)}
- Use the exact keywords provided, DO NOT translate or vary them: {', '.join(important_keywords or [])}
- Keep content natural but concise
- Do not use any explicit years, dates or times
- NO markdown, NO formatting, NO additional lines
- Each line must start with "- " followed by the exact label"""
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
            cache_key = self.get_cache_key(county, race_type, category)
            cache = self.load_seo_cache()
            cache[cache_key] = result
            self.save_seo_cache(cache)
            
            return result
            
        except IndexError as e:
            print(f"Error parsing AI response: {e}")
            return self.generate_basic_seo_content(index_content, county, race_type, category)
