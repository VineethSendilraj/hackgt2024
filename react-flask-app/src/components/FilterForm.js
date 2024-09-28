import { useEffect, useState } from 'react';

import {
  Button,
  FormControl,
  FormLabel,
  Checkbox,
  CheckboxGroup,
  Input,
  Stack,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';

const FilterForm = ({ filters, setFilters, id }) => {
  // on mount fill out the state
  const [year, setYear] = useState(filters[id].year);
  const [crime, setCrime] = useState(filters[id].crime);

  const updateFilter = (c, e) => {
    let updatedFilter = filters;
    updatedFilter[id][c] = e;
    setFilters({ ...updatedFilter });
  };

  const delFilter = () => {
    let updatedFilter = filters;
    delete updatedFilter[id];
    setFilters({ ...updatedFilter });
  };

  return (
    <>
      <CheckboxGroup
        onChange={e => {
          updateFilter('crime', e);
        }}
        defaultValue={filters[id].crime}
      >
        <FormLabel>Crime Involved</FormLabel>
        <SimpleGrid spacing={5} columns={2}>
          <Checkbox value="Aggravated Assault">Aggravated Assault</Checkbox>
          <Checkbox value="Auto Theft">Auto Theft</Checkbox>
          <Checkbox value="Larceny-From Vehicle">Larceny-From Vehicle</Checkbox>
          <Checkbox value="Larceny-Non Vehicle">Larceny-Non Vehicle</Checkbox>
          <Checkbox value="Burglary">Burglary</Checkbox>
          <Checkbox value="Homicide">Homicide</Checkbox>
          <Checkbox value="Robbery">Robbery</Checkbox>
        </SimpleGrid>
      </CheckboxGroup>
      {Object.keys(filters).length > 1 ? (
        <Button
          colorScheme="red"
          onClick={() => {
            delFilter();
          }}
        >
          Remove Filter
        </Button>
      ) : (
        <></>
      )}
    </>
  );
};

export default FilterForm;